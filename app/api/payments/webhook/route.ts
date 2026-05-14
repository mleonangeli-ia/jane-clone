import { NextRequest, NextResponse } from "next/server";
import { payment } from "@/lib/mercadopago";
import { prisma } from "@/lib/db";
import { sendBookingEmails } from "@/lib/emails/send-booking-emails";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: true });

  const { type, data } = body;

  // MercadoPago sends "payment" notifications
  if (type === "payment" && data?.id) {
    await handlePaymentNotification(String(data.id));
  }

  return NextResponse.json({ ok: true });
}

async function handlePaymentNotification(paymentId: string) {
  let mpPayment;
  try {
    mpPayment = await payment.get({ id: paymentId });
  } catch {
    return;
  }

  const appointmentId = mpPayment.external_reference;
  if (!appointmentId) return;

  const status = mpPayment.status;

  if (status === "approved") {
    await prisma.$transaction([
      prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: "CONFIRMED", paymentStatus: "PAID" },
      }),
      prisma.payment.upsert({
        where: { appointmentId },
        create: {
          appointmentId,
          amount: Math.round((mpPayment.transaction_amount ?? 0) * 100),
          currency: mpPayment.currency_id?.toLowerCase() ?? "ars",
          stripePaymentIntentId: paymentId,
          status: "PAID",
        },
        update: {
          status: "PAID",
          stripePaymentIntentId: paymentId,
        },
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

  if (status === "rejected" || status === "cancelled") {
    await prisma.appointment.update({
      where: { id: appointmentId, status: "PENDING" },
      data: { status: "CANCELLED" },
    }).catch(() => {});
  }
}
