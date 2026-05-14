import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { sendBookingEmails } from "@/lib/emails/send-booking-emails";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Webhook signature invalid" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
  }

  if (event.type === "checkout.session.expired") {
    await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const appointmentId = session.metadata?.appointmentId;
  if (!appointmentId) return;

  await prisma.$transaction([
    prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "CONFIRMED", paymentStatus: "PAID" },
    }),
    prisma.payment.upsert({
      where: { appointmentId },
      create: {
        appointmentId,
        amount: session.amount_total ?? 0,
        currency: session.currency ?? "ars",
        stripeCheckoutSession: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
        status: "PAID",
      },
      update: {
        status: "PAID",
        stripePaymentIntentId:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
      },
    }),
  ]);

  // Send confirmation emails after payment is confirmed
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      client: true,
      service: true,
      tenant: true,
    },
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
      appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    }).catch(console.error);
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const appointmentId = session.metadata?.appointmentId;
  if (!appointmentId) return;

  await prisma.appointment.update({
    where: { id: appointmentId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
}
