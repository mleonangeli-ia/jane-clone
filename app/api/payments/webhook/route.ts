import { NextRequest, NextResponse } from "next/server";
import { getPayment } from "@/lib/mercadopago";
import { prisma } from "@/lib/db";
import { sendBookingEmails } from "@/lib/emails/send-booking-emails";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: true });

  const { type, data } = body;
  if (type === "payment" && data?.id) {
    await handlePayment(String(data.id));
  }

  return NextResponse.json({ ok: true });
}

async function handlePayment(paymentId: string) {
  let mpData;
  try {
    mpData = await getPayment(paymentId);
  } catch {
    return;
  }

  const appointmentId = mpData.external_reference;
  if (!appointmentId) return;

  if (mpData.status === "approved") {
    await prisma.$transaction([
      prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: "CONFIRMED", paymentStatus: "PAID" },
      }),
      prisma.payment.upsert({
        where: { appointmentId },
        create: {
          appointmentId,
          amount: Math.round((mpData.transaction_amount ?? 0) * 100),
          currency: mpData.currency_id?.toLowerCase() ?? "ars",
          stripePaymentIntentId: paymentId,
          status: "PAID",
        },
        update: { status: "PAID", stripePaymentIntentId: paymentId },
      }),
    ]);

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { client: true, service: true, tenant: true },
    });

    if (appointment) {
      sendBookingEmails({
        clientName: appointment.client.name,
        clientEmail: appointment.client.email,
        clientPhone: appointment.client.phone,
        tenantName: appointment.tenant.name,
        tenantEmail: appointment.tenant.email,
        tenantAddress: appointment.tenant.address,
        serviceName: appointment.service.name,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        price: appointment.service.price,
        currency: appointment.tenant.currency,
        notes: appointment.notes,
        tenantSlug: appointment.tenant.slug,
        appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001",
      }).catch(console.error);
    }
  }

  if (["rejected", "cancelled"].includes(mpData.status ?? "")) {
    await prisma.appointment.update({
      where: { id: appointmentId, status: "PENDING" },
      data: { status: "CANCELLED" },
    }).catch(() => {});
  }
}
