import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCancelToken, generateCancelToken } from "@/lib/cancel-token";
import { addMinutes, parseISO, differenceInHours } from "date-fns";
import { sendBookingEmails } from "@/lib/emails/send-booking-emails";
import { createCalendarEvent, deleteCalendarEvent } from "@/lib/google-calendar";
import { getClientIp, consume } from "@/lib/rate-limit";

// 3 reagendamientos por IP por hora
const RATE = { max: 3, windowMs: 60 * 60_000 };

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!consume(`reschedule:${ip}`, RATE.max, RATE.windowMs).allowed) {
    return NextResponse.json({ error: "Demasiados intentos. Intentá más tarde." }, { status: 429 });
  }

  const { appointmentId, token, newStartTime } = await req.json().catch(() => ({}));

  if (!appointmentId || !token || !newStartTime) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  // Load appointment with all relations
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { client: true, service: true, tenant: true },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
  }

  // Verify token
  if (!verifyCancelToken(token, appointment.id, appointment.createdAt)) {
    return NextResponse.json({ error: "Link inválido o expirado" }, { status: 403 });
  }

  // Can only reschedule CONFIRMED or PENDING appointments
  if (!["CONFIRMED", "PENDING"].includes(appointment.status)) {
    return NextResponse.json({ error: "Este turno no se puede reagendar" }, { status: 409 });
  }

  // Check cancellation window
  const cancelHours = appointment.tenant.cancelWindowHours ?? 2;
  const hoursUntil = differenceInHours(appointment.startTime, new Date());
  if (hoursUntil < cancelHours) {
    return NextResponse.json({
      error: `No se puede reagendar con menos de ${cancelHours} horas de anticipación`,
    }, { status: 409 });
  }

  const newStart = parseISO(newStartTime);
  const newEnd   = addMinutes(newStart, appointment.service.duration);

  // Check conflict on the new slot
  const conflict = await prisma.appointment.findFirst({
    where: {
      tenantId: appointment.tenantId,
      id: { not: appointment.id },
      status: { notIn: ["CANCELLED"] },
      OR: [
        { startTime: { gte: newStart, lt: newEnd } },
        { endTime: { gt: newStart, lte: newEnd } },
        { startTime: { lte: newStart }, endTime: { gte: newEnd } },
      ],
    },
  });

  if (conflict) {
    return NextResponse.json({ error: "El nuevo horario ya no está disponible" }, { status: 409 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Create new appointment (same service + client)
  const newAppointment = await prisma.appointment.create({
    data: {
      tenantId:  appointment.tenantId,
      serviceId: appointment.serviceId,
      clientId:  appointment.clientId,
      startTime: newStart,
      endTime:   newEnd,
      status:    "CONFIRMED",
      paymentStatus: appointment.paymentStatus, // carry over paid status
      notes: appointment.notes,
    },
  });

  // Cancel the old appointment
  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: "CANCELLED" },
  });

  // Delete old calendar event
  if (appointment.googleEventId && appointment.tenant.googleRefreshToken) {
    deleteCalendarEvent(appointment.googleEventId, appointment.tenant.googleRefreshToken)
      .catch(console.error);
  }

  // Create new calendar event
  if (appointment.tenant.googleRefreshToken) {
    createCalendarEvent({
      refreshToken: appointment.tenant.googleRefreshToken,
      summary:     `${appointment.client.name} — ${appointment.service.name}`,
      description: `Cliente: ${appointment.client.email} (reagendado)`,
      startTime:   newStart,
      endTime:     newEnd,
      location:    appointment.tenant.address ?? undefined,
    }).then(async (eventId) => {
      if (eventId) await prisma.appointment.update({
        where: { id: newAppointment.id },
        data: { googleEventId: eventId },
      });
    }).catch(console.error);
  }

  // Send new confirmation email
  const newToken = generateCancelToken(newAppointment.id, newAppointment.createdAt);
  sendBookingEmails({
    clientName:    appointment.client.name,
    clientEmail:   appointment.client.email,
    clientPhone:   appointment.client.phone,
    tenantName:    appointment.tenant.name,
    tenantEmail:   appointment.tenant.email,
    tenantAddress: appointment.tenant.address,
    serviceName:   appointment.service.name,
    startTime:     newStart,
    endTime:       newEnd,
    price:         appointment.service.price,
    currency:      appointment.tenant.currency,
    notes:         appointment.notes,
    tenantSlug:    appointment.tenant.slug,
    appUrl,
    appointmentId:      newAppointment.id,
    appointmentCreatedAt: newAppointment.createdAt,
    intakeUrl: null,
  }).catch(console.error);

  return NextResponse.json({ id: newAppointment.id });
}
