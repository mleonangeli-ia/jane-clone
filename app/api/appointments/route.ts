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

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  const body = await req.json();
  const { tenantId, serviceId, startTime, clientName, clientEmail, clientPhone, notes, _hp } = body;

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

  const conflict = await prisma.appointment.findFirst({
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
  if (conflict) {
    return NextResponse.json({ error: "El horario ya no está disponible" }, { status: 409 });
  }

  const client = await prisma.client.upsert({
    where: { tenantId_email: { tenantId, email: clientEmail } },
    update: { name: clientName, phone: clientPhone ?? undefined },
    create: { tenantId, name: clientName, email: clientEmail, phone: clientPhone ?? undefined },
  });

  const paymentsEnabled = process.env.PAYMENTS_ENABLED !== "false";
  const requiresPayment = paymentsEnabled && service.price > 0;
  const status = requiresPayment ? "PENDING" : "CONFIRMED";

  const appointment = await prisma.appointment.create({
    data: {
      tenantId,
      serviceId,
      clientId: client.id,
      startTime: start,
      endTime: end,
      status,
      notes: notes ?? undefined,
    },
  });

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
      clientPhone: clientPhone ?? null,
      tenantName: tenant.name,
      tenantEmail: tenant.email,
      tenantAddress: tenant.address,
      serviceName: service.name,
      startTime: start,
      endTime: end,
      price: service.price,
      currency: tenant.currency,
      notes: notes ?? null,
      tenantSlug: tenant.slug,
      appUrl,
      appointmentId: appointment.id,
      appointmentCreatedAt: appointment.createdAt,
      intakeUrl,
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
  }

  return NextResponse.json(
    { id: appointment.id, requiresPayment, price: service.price },
    { status: 201 }
  );
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const appointments = await prisma.appointment.findMany({
    where: { tenantId: session.user.id },
    include: { client: true, service: true },
    orderBy: { startTime: "desc" },
  });
  return NextResponse.json(appointments);
}
