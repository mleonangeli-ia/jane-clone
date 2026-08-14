import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notifyWaitlist } from "@/lib/notifications/waitlist";
import { createCalendarEvent, deleteCalendarEvent } from "@/lib/google-calendar";
import { parseISO, addMinutes } from "date-fns";
import { sendBookingEmails } from "@/lib/emails/send-booking-emails";
import { generateCancelToken } from "@/lib/cancel-token";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status, paymentStatus, startTime: newStartTimeStr } = await req.json();

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { client: true, service: true, tenant: true },
  });

  if (!appointment || appointment.tenantId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // ── Reagendamiento desde dashboard ──────────────────────────
  if (newStartTimeStr) {
    const newStart = parseISO(newStartTimeStr);
    const newEnd   = addMinutes(newStart, appointment.service.duration);

    // Check for conflicts (exclude this appointment)
    const conflict = await prisma.appointment.findFirst({
      where: {
        tenantId: appointment.tenantId,
        id:       { not: id },
        status:   { notIn: ["CANCELLED"] },
        OR: [
          { startTime: { gte: newStart, lt: newEnd } },
          { endTime:   { gt: newStart, lte: newEnd } },
          { startTime: { lte: newStart }, endTime: { gte: newEnd } },
        ],
      },
    });
    if (conflict) {
      return NextResponse.json({ error: "El horario ya está ocupado" }, { status: 409 });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { startTime: newStart, endTime: newEnd },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Update Google Calendar event
    if (appointment.tenant.googleRefreshToken) {
      if (appointment.googleEventId) {
        deleteCalendarEvent(appointment.googleEventId, appointment.tenant.googleRefreshToken).catch(console.error);
      }
      createCalendarEvent({
        refreshToken: appointment.tenant.googleRefreshToken,
        summary:      `${appointment.client.name} — ${appointment.service.name}`,
        description:  `Cliente: ${appointment.client.email} (reagendado desde dashboard)`,
        startTime:    newStart,
        endTime:      newEnd,
        location:     appointment.tenant.address ?? undefined,
      }).then(async (eventId) => {
        if (eventId) await prisma.appointment.update({ where: { id }, data: { googleEventId: eventId } });
      }).catch(console.error);
    }

    // Email notification to client
    const cancelToken = generateCancelToken(id, appointment.createdAt);
    sendBookingEmails({
      clientName:           appointment.client.name,
      clientEmail:          appointment.client.email,
      clientPhone:          appointment.client.phone,
      tenantName:           appointment.tenant.name,
      tenantEmail:          appointment.tenant.email,
      tenantAddress:        appointment.tenant.address,
      serviceName:          appointment.service.name,
      startTime:            newStart,
      endTime:              newEnd,
      price:                appointment.service.price,
      currency:             appointment.tenant.currency,
      notes:                appointment.notes,
      tenantSlug:           appointment.tenant.slug,
      appUrl,
      appointmentId:        id,
      appointmentCreatedAt: appointment.createdAt,
      intakeUrl:            null,
    }).catch(console.error);

    return NextResponse.json(updated);
  }

  // ── Status / payment update (atomic) ────────────────────────
  const [updated] = await prisma.$transaction([
    prisma.appointment.update({
      where: { id },
      data: {
        ...(status        ? { status }        : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
      },
    }),
    ...(paymentStatus === "PAID" ? [
      prisma.payment.upsert({
        where:  { appointmentId: id },
        create: { appointmentId: id, amount: 0, currency: "ars", status: "PAID" },
        update: { status: "PAID" },
      }),
    ] : []),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (status === "CANCELLED") {
    notifyWaitlist(appointment.tenantId, appointment.serviceId, appointment.startTime, appUrl).catch(console.error);
    if (appointment.googleEventId && appointment.tenant.googleRefreshToken) {
      deleteCalendarEvent(appointment.googleEventId, appointment.tenant.googleRefreshToken).catch(console.error);
    }
  }

  if (status === "CONFIRMED" && appointment.tenant.googleRefreshToken) {
    createCalendarEvent({
      refreshToken: appointment.tenant.googleRefreshToken,
      summary:      `${appointment.client.name} — ${appointment.service.name}`,
      description:  `Cliente: ${appointment.client.email}`,
      startTime:    appointment.startTime,
      endTime:      appointment.endTime,
      location:     appointment.tenant.address ?? undefined,
    }).then(async (eventId) => {
      if (eventId) await prisma.appointment.update({ where: { id }, data: { googleEventId: eventId } });
    }).catch(console.error);
  }

  return NextResponse.json(updated);
}
