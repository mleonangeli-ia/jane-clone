import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { reminderEmail } from "@/lib/emails/reminder";
import { startOfDay, endOfDay, addDays } from "date-fns";

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tomorrow = addDays(new Date(), 1);
  const windowStart = startOfDay(tomorrow);
  const windowEnd = endOfDay(tomorrow);

  const appointments = await prisma.appointment.findMany({
    where: {
      status: "CONFIRMED",
      startTime: { gte: windowStart, lte: windowEnd },
      reminderSentAt: null,
    },
    include: { client: true, service: true, tenant: true },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const results = await Promise.allSettled(
    appointments.map((apt) => {
      const { subject, html } = reminderEmail({
        clientName: apt.client.name,
        tenantName: apt.tenant.name,
        tenantAddress: apt.tenant.address,
        serviceName: apt.service.name,
        startTime: apt.startTime,
        endTime: apt.endTime,
        price: apt.service.price,
        currency: apt.tenant.currency,
        bookingUrl: `${appUrl}/book/${apt.tenant.slug}`,
      });
      return resend.emails.send({
        from: FROM_EMAIL,
        to: apt.client.email,
        subject,
        html,
      });
    })
  );

  const sentCount = results.filter((r) => r.status === "fulfilled").length;

  if (appointments.length > 0) {
    await prisma.appointment.updateMany({
      where: { id: { in: appointments.map((a) => a.id) } },
      data: { reminderSentAt: new Date() },
    });
  }

  return NextResponse.json({ sent: sentCount });
}
