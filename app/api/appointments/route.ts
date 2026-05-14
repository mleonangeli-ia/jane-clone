import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addMinutes, parseISO } from "date-fns";
import { sendBookingEmails } from "@/lib/emails/send-booking-emails";

export async function POST(req: NextRequest) {
  const { tenantId, serviceId, startTime, clientName, clientEmail, clientPhone, notes } =
    await req.json();

  if (!tenantId || !serviceId || !startTime || !clientName || !clientEmail) {
    return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
  }

  const [service, tenant] = await Promise.all([
    prisma.service.findFirst({ where: { id: serviceId, tenantId, isActive: true } }),
    prisma.tenant.findUnique({ where: { id: tenantId } }),
  ]);

  if (!service || !tenant) {
    return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
  }

  const start = parseISO(startTime);
  const end = addMinutes(start, service.duration);

  const conflict = await prisma.appointment.findFirst({
    where: {
      tenantId,
      status: { notIn: ["CANCELLED"] },
      OR: [
        { startTime: { gte: start, lt: end } },
        { endTime: { gt: start, lte: end } },
        { startTime: { lte: start }, endTime: { gte: end } },
      ],
    },
  });
  if (conflict) {
    return NextResponse.json({ error: "El horario ya no está disponible" }, { status: 409 });
  }

  const client = await prisma.client.upsert({
    where: { tenantId_email: { tenantId, email: clientEmail } },
    update: { name: clientName, phone: clientPhone ?? undefined },
    create: { tenantId, name: clientName, email: clientEmail, phone: clientPhone ?? undefined },
  });

  const stripeEnabled = process.env.STRIPE_ENABLED !== "false";
  const requiresPayment = stripeEnabled && service.price > 0;
  const status = requiresPayment ? "PENDING" : "CONFIRMED";

  const appointment = await prisma.appointment.create({
    data: {
      tenantId,
      serviceId,
      clientId: client.id,
      startTime: start,
      endTime: end,
      status,
      notes: notes ?? undefined,
    },
  });

  // Send confirmation emails for free appointments immediately
  if (!requiresPayment) {
    sendBookingEmails({
      clientName,
      clientEmail,
      clientPhone: clientPhone ?? null,
      tenantName: tenant.name,
      tenantEmail: tenant.email,
      tenantAddress: tenant.address,
      serviceName: service.name,
      startTime: start,
      endTime: end,
      price: service.price,
      currency: tenant.currency,
      notes: notes ?? null,
      tenantSlug: tenant.slug,
      appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    }).catch(console.error); // fire-and-forget, don't block the response
  }

  return NextResponse.json(
    { id: appointment.id, requiresPayment, price: service.price },
    { status: 201 }
  );
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const appointments = await prisma.appointment.findMany({
    where: { tenantId: session.user.id },
    include: { client: true, service: true },
    orderBy: { startTime: "desc" },
  });
  return NextResponse.json(appointments);
}
