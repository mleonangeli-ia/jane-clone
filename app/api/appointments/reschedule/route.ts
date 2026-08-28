import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCancelToken } from "@/lib/cancel-token";
import { addMinutes, parseISO, differenceInHours } from "date-fns";
import { sendBookingEmails } from "@/lib/emails/send-booking-emails";
import { createCalendarEvent, deleteCalendarEvent } from "@/lib/google-calendar";
import { getClientIp, consume } from "@/lib/rate-limit";
import { generateMeetingUrl } from "@/lib/meeting";
import { Prisma, type Appointment } from "@prisma/client";
import {
  isTransactionWriteConflict,
  runSerializableWithRetry,
} from "@/lib/serializable-transaction";
import { getRescheduleRejection } from "@/lib/appointment-workflow";

// 3 reagendamientos por IP por hora
const RATE = { max: 3, windowMs: 60 * 60_000 };

class RescheduleRejectedError extends Error {}

async function withSerializableRetry<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return runSerializableWithRetry(prisma.$transaction.bind(prisma), operation);
}

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

  const initialRejection = getRescheduleRejection({
    servicePrice: appointment.service.price,
    appointmentStatus: appointment.status,
    paymentStatus: appointment.paymentStatus,
  });
  if (initialRejection) {
    return NextResponse.json({ error: initialRejection }, { status: 409 });
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  let newAppointment: Appointment;
  try {
    newAppointment = await withSerializableRetry(async (tx) => {
      const current = await tx.appointment.findUnique({
        where: { id: appointment.id },
        select: { status: true, paymentStatus: true },
      });
      if (!current) {
        throw new RescheduleRejectedError("Este turno no se puede reagendar");
      }
      const currentRejection = getRescheduleRejection({
        servicePrice: appointment.service.price,
        appointmentStatus: current.status,
        paymentStatus: current.paymentStatus,
      });
      if (currentRejection) {
        throw new RescheduleRejectedError(currentRejection);
      }

      const conflict = await tx.appointment.findFirst({
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
      if (conflict) throw new RescheduleRejectedError("El nuevo horario ya no está disponible");

      return tx.appointment.update({
        where: { id: appointment.id },
        data: { startTime: newStart, endTime: newEnd },
      });
    });
  } catch (error) {
    if (error instanceof RescheduleRejectedError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (isTransactionWriteConflict(error)) {
      return NextResponse.json({ error: "El nuevo horario ya no está disponible" }, { status: 409 });
    }
    throw error;
  }

  if (appointment.service.isVirtual) {
    const url = generateMeetingUrl(newAppointment.id);
    await prisma.appointment.update({ where: { id: newAppointment.id }, data: { meetingUrl: url } });
  }

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
    appointmentId:        newAppointment.id,
    appointmentCreatedAt: newAppointment.createdAt,
    intakeUrl:  null,
    meetingUrl: appointment.service.isVirtual ? generateMeetingUrl(newAppointment.id) : null,
  }).catch(console.error);

  return NextResponse.json({ id: newAppointment.id });
}
