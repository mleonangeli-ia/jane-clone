import { NextRequest, NextResponse } from "next/server";
import { preference } from "@/lib/mercadopago";
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
  const slug = appointment.tenant.slug;

  const result = await preference.create({
    body: {
      items: [
        {
          id: appointment.serviceId,
          title: appointment.service.name,
          description: `Turno con ${appointment.tenant.name}`,
          quantity: 1,
          unit_price: appointment.service.price / 100,
          currency_id: "ARS",
        },
      ],
      payer: {
        name: appointment.client.name,
        email: appointment.client.email,
      },
      external_reference: appointment.id,
      back_urls: {
        success: `${appUrl}/book/${slug}/success?appointment_id=${appointment.id}`,
        failure: `${appUrl}/book/${slug}/cancel?appointment_id=${appointment.id}`,
        pending: `${appUrl}/book/${slug}/success?appointment_id=${appointment.id}&pending=1`,
      },
      auto_return: "approved",
      notification_url: `${appUrl}/api/payments/webhook`,
      statement_descriptor: "JaneClone",
    },
  });

  // Store preference ID on appointment
  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { stripeCheckoutSession: result.id },
  });

  const url = process.env.MP_ACCESS_TOKEN?.startsWith("TEST")
    ? result.sandbox_init_point
    : result.init_point;

  return NextResponse.json({ url });
}
