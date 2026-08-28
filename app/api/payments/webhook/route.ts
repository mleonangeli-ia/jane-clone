import { NextRequest, NextResponse } from "next/server";
import { getPayment } from "@/lib/mercadopago";
import { prisma } from "@/lib/db";
import { sendBookingEmails } from "@/lib/emails/send-booking-emails";
import { createCalendarEvent } from "@/lib/google-calendar";
import { verifyMercadoPagoSignature } from "@/lib/mercadopago-security";

function verifyMpSignature(req: NextRequest): boolean {
  return verifyMercadoPagoSignature({
    secret: process.env.MP_WEBHOOK_SECRET,
    signatureHeader: req.headers.get("x-signature"),
    requestId: req.headers.get("x-request-id"),
    dataId: req.nextUrl.searchParams.get("data.id"),
  });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  let body: { type?: string; data?: { id?: string } } | null = null;
  try { body = JSON.parse(rawBody); } catch { /* ignore */ }
  if (!body) return NextResponse.json({ ok: true });

  if (!verifyMpSignature(req)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

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
          mpPaymentId: paymentId,
          status: "PAID",
        },
        update: { status: "PAID", mpPaymentId: paymentId },
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
        appointmentId: appointment.id,
        appointmentCreatedAt: appointment.createdAt,
        intakeUrl: null,
      }).catch(console.error);

      if (appointment.tenant.googleRefreshToken) {
        createCalendarEvent({
          refreshToken: appointment.tenant.googleRefreshToken,
          summary: `${appointment.client.name} — ${appointment.service.name}`,
          description: `Cliente: ${appointment.client.email}`,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          location: appointment.tenant.address ?? undefined,
        }).then(async (eventId) => {
          if (eventId) await prisma.appointment.update({ where: { id: appointmentId }, data: { googleEventId: eventId } });
        }).catch(console.error);
      }
    }
  }

  if (["rejected", "cancelled"].includes(mpData.status ?? "")) {
    await prisma.appointment.update({
      where: { id: appointmentId, status: "PENDING" },
      data: { status: "CANCELLED" },
    }).catch(() => {});
  }
}
