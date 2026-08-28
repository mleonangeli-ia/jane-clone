import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addMinutes, parseISO } from "date-fns";
import { sendBookingEmails } from "@/lib/emails/send-booking-emails";
import { getClientIp } from "@/lib/rate-limit";
import { generateIntakeToken } from "@/lib/intake-token";
import { checkBookingRateLimit, isDisposableEmail, isHoneypotClean } from "@/lib/abuse";
import { createCalendarEvent } from "@/lib/google-calendar";
import { sendPushToTenant } from "@/lib/push/send";
import { generateMeetingUrl } from "@/lib/meeting";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Prisma, type Appointment } from "@prisma/client";
import {
  APPOINTMENT_ACCESS_COOKIE,
  appointmentAccessCookieOptions,
  createAppointmentAccessToken,
} from "@/lib/appointment-access-token";
import {
  isTransactionWriteConflict,
  runSerializableWithRetry,
} from "@/lib/serializable-transaction";

class SlotUnavailableError extends Error {}

async function withSerializableRetry<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return runSerializableWithRetry(prisma.$transaction.bind(prisma), operation);
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  const body = await req.json();
  const { tenantId, serviceId, staffId, startTime, clientName, clientEmail, clientPhone, notes, _hp } = body;

  // ── Abuse prevention ──────────────────────────────────────────
  // 1. Honeypot — silently accept but discard (bots won't know)
  if (!isHoneypotClean(_hp)) {
    return NextResponse.json({ id: "ok", requiresPayment: false }, { status: 201 });
  }

  // 2. Disposable email check
  if (clientEmail && isDisposableEmail(clientEmail)) {
    return NextResponse.json({ error: "Email no permitido. Usá una dirección de email válida." }, { status: 422 });
  }

  // 3. Rate limit: per-IP and per-email
  const { ipResult, emailResult } = checkBookingRateLimit(ip, (clientEmail ?? "").toLowerCase());
  if (!ipResult.allowed) {
    return NextResponse.json({ error: "Demasiadas reservas. Intentá en unos minutos." }, { status: 429 });
  }
  if (!emailResult.allowed) {
    return NextResponse.json({ error: "Límite de reservas diarias alcanzado para este email." }, { status: 429 });
  }
  // ─────────────────────────────────────────────────────────────

  if (!tenantId || !serviceId || !startTime || !clientName || !clientEmail) {
    return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
  }

  const [service, tenant] = await Promise.all([
    prisma.service.findFirst({ where: { id: serviceId, tenantId, isActive: true } }),
    prisma.tenant.findUnique({ where: { id: tenantId } }),
  ]);

  if (!service || !tenant) {
    return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
  }

  const start = parseISO(startTime);
  const end = addMinutes(start, service.duration);

  const paymentsEnabled = process.env.PAYMENTS_ENABLED !== "false";
  const requiresPayment = paymentsEnabled && service.price > 0;
  const status = requiresPayment ? "PENDING" : "CONFIRMED";

  let appointment: Appointment;
  try {
    appointment = await withSerializableRetry(async (tx) => {
      const conflict = await tx.appointment.findFirst({
        where: {
          tenantId,
          status: { notIn: ["CANCELLED"] },
          OR: [
            { startTime: { gte: start, lt: end } },
            { endTime: { gt: start, lte: end } },
            { startTime: { lte: start }, endTime: { gte: end } },
          ],
        },
      });
      if (conflict) throw new SlotUnavailableError();

      const client = await tx.client.upsert({
        where: { tenantId_email: { tenantId, email: clientEmail } },
        update: { name: clientName, phone: clientPhone ?? undefined },
        create: { tenantId, name: clientName, email: clientEmail, phone: clientPhone ?? undefined },
      });

      return tx.appointment.create({
        data: {
          tenantId,
          serviceId,
          clientId: client.id,
          staffId: staffId ?? undefined,
          startTime: start,
          endTime: end,
          status,
          notes: notes ?? undefined,
          meetingUrl: service.isVirtual ? "__pending__" : undefined,
        },
      });
    });
  } catch (error) {
    if (error instanceof SlotUnavailableError || isTransactionWriteConflict(error)) {
      return NextResponse.json({ error: "El horario ya no está disponible" }, { status: 409 });
    }
    throw error;
  }

  // Now we have the appointmentId — generate the deterministic Jitsi URL
  if (service.isVirtual) {
    const meetingUrl = generateMeetingUrl(appointment.id);
    await prisma.appointment.update({
      where: { id: appointment.id },
      data:  { meetingUrl },
    });
    (appointment as typeof appointment & { meetingUrl: string | null }).meetingUrl = meetingUrl;
  }

  let intakeUrl: string | null = null;
  if (service.intakeFormId) {
    const formResponse = await prisma.formResponse.create({
      data: {
        appointmentId: appointment.id,
        formId: service.intakeFormId,
      },
    });
    const intakeToken = generateIntakeToken(formResponse.id, formResponse.createdAt);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    intakeUrl = `${appUrl}/intake/${formResponse.id}?token=${intakeToken}`;
  }

  // Send confirmation emails + create calendar event for free appointments
  if (!requiresPayment) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    sendBookingEmails({
      clientName,
      clientEmail,
      clientPhone:   clientPhone ?? null,
      tenantName:    tenant.name,
      tenantEmail:   tenant.email,
      tenantAddress: tenant.address,
      serviceName:   service.name,
      startTime:     start,
      endTime:       end,
      price:         service.price,
      currency:      tenant.currency,
      notes:         notes ?? null,
      tenantSlug:    tenant.slug,
      appUrl,
      appointmentId:        appointment.id,
      appointmentCreatedAt: appointment.createdAt,
      intakeUrl,
      meetingUrl: service.isVirtual ? generateMeetingUrl(appointment.id) : null,
    }).catch(console.error);

    // Sync to Google Calendar if the professional has it connected
    if (tenant.googleRefreshToken) {
      createCalendarEvent({
        refreshToken: tenant.googleRefreshToken,
        summary: `${clientName} — ${service.name}`,
        description: `Paciente: ${clientEmail}${notes ? `\nNotas: ${notes}` : ""}`,
        startTime: start,
        endTime: end,
        location: tenant.address ?? undefined,
      }).then(async (eventId) => {
        if (eventId) {
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { googleEventId: eventId },
          });
        }
      }).catch(console.error);
    }

    // Push notification to the professional
    sendPushToTenant(tenantId, {
      title: "📅 Nuevo turno reservado",
      body:  `${clientName} · ${service.name} · ${format(start, "d MMM HH:mm", { locale: es })}`,
      url:   "/dashboard/appointments",
    }).catch(console.error);
  }

  const response = NextResponse.json(
    { id: appointment.id, requiresPayment, price: service.price },
    { status: 201 }
  );
  response.cookies.set(
    APPOINTMENT_ACCESS_COOKIE,
    createAppointmentAccessToken(appointment.id),
    appointmentAccessCookieOptions(process.env.NODE_ENV),
  );
  return response;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const appointments = await prisma.appointment.findMany({
    where: { tenantId: session.user.id },
    include: { client: true, service: true },
    orderBy: { startTime: "desc" },
  });
  return NextResponse.json(appointments);
}
