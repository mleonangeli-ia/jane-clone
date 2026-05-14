import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { appointmentId } = await req.json();

  if (!appointmentId) {
    return NextResponse.json({ error: "appointmentId requerido" }, { status: 400 });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { service: true, client: true, tenant: true },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
  }

  if (appointment.status !== "PENDING") {
    return NextResponse.json({ error: "El turno ya fue procesado" }, { status: 409 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const slug = appointment.tenant.slug;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: appointment.client.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "ars",
          unit_amount: appointment.service.price,
          product_data: {
            name: appointment.service.name,
            description: `Turno con ${appointment.tenant.name}`,
          },
        },
      },
    ],
    metadata: {
      appointmentId: appointment.id,
      tenantId: appointment.tenantId,
    },
    success_url: `${appUrl}/book/${slug}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/book/${slug}/cancel?appointment_id=${appointment.id}`,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 min
  });

  // Store session ID on appointment so webhook can find it
  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { stripeCheckoutSession: session.id },
  });

  return NextResponse.json({ url: session.url });
}
