import { NextRequest, NextResponse } from "next/server";
import { getPayment } from "@/lib/mercadopago";
import { prisma } from "@/lib/db";
import { sendBookingEmails } from "@/lib/emails/send-booking-emails";
import { createCalendarEvent } from "@/lib/google-calendar";
import crypto from "crypto";

function verifyMpSignature(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  // If no secret configured, skip verification (dev/test mode)
  if (!secret) return true;

  // MP sends: x-signature: ts=<timestamp>,v1=<hmac>
  const header = req.headers.get("x-signature") ?? "";
  const xRequestId = req.headers.get("x-request-id") ?? "";
  const dataId = new URL(req.url).searchParams.get("data.id") ?? "";

  const tsMatch = header.match(/ts=([^,]+)/);
  const v1Match = header.match(/v1=([^,]+)/);
  if (!tsMatch || !v1Match) return false;

  const ts = tsMatch[1];
  const receivedHash = v1Match[1];

  // MP signs: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  return crypto.timingSafeEqual(Buffer.from(receivedHash, "hex"), Buffer.from(expected, "hex"));
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  let body: { type?: string; data?: { id?: string } } | null = null;
  try { body = JSON.parse(rawBody); } catch { /* ignore */ }
  if (!body) return NextResponse.json({ ok: true });

  if (!verifyMpSignature(req, rawBody)) {
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
