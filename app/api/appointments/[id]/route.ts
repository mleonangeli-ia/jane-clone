import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notifyWaitlist } from "@/lib/notifications/waitlist";
import { createCalendarEvent, deleteCalendarEvent } from "@/lib/google-calendar";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status, paymentStatus } = await req.json();

  const appointment = await prisma.appointment.findUnique({
    where: { id },
  });

  if (!appointment || appointment.tenantId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(paymentStatus ? { paymentStatus } : {}),
    },
  });

  // If marking as paid manually, upsert a payment record
  if (paymentStatus === "PAID") {
    await prisma.payment.upsert({
      where: { appointmentId: id },
      create: {
        appointmentId: id,
        amount: 0,
        currency: "ars",
        status: "PAID",
      },
      update: { status: "PAID" },
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (status === "CANCELLED") {
    const full = await prisma.appointment.findUnique({
      where: { id },
      include: { tenant: true },
    });
    if (full) {
      notifyWaitlist(full.tenantId, full.serviceId, full.startTime, appUrl).catch(console.error);
      if (full.googleEventId && full.tenant.googleRefreshToken) {
        deleteCalendarEvent(full.googleEventId, full.tenant.googleRefreshToken).catch(console.error);
      }
    }
  }

  if (status === "CONFIRMED") {
    const full = await prisma.appointment.findUnique({
      where: { id },
      include: { client: true, service: true, tenant: true },
    });
    if (full?.tenant.googleRefreshToken) {
      createCalendarEvent({
        refreshToken: full.tenant.googleRefreshToken,
        summary: `${full.client.name} — ${full.service.name}`,
        description: `Cliente: ${full.client.email}`,
        startTime: full.startTime,
        endTime: full.endTime,
        location: full.tenant.address ?? undefined,
      }).then(async (eventId) => {
        if (eventId) await prisma.appointment.update({ where: { id }, data: { googleEventId: eventId } });
      }).catch(console.error);
    }
  }

  return NextResponse.json(updated);
}
