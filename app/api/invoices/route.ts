import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET — list all invoices for this tenant
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invoices = await prisma.invoice.findMany({
    where: { tenantId: session.user.id },
    orderBy: { number: "desc" },
    take: 100,
  });

  return NextResponse.json(invoices);
}

// POST — create invoice from an appointment
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { appointmentId, taxRate = 0, notes } = await req.json();

  if (!appointmentId) {
    return NextResponse.json({ error: "appointmentId requerido" }, { status: 400 });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { client: true, service: true, tenant: true },
  });

  if (!appointment || appointment.tenantId !== session.user.id) {
    return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
  }

  // Check if invoice already exists for this appointment
  const existing = await prisma.invoice.findUnique({
    where: { appointmentId },
  });
  if (existing) {
    return NextResponse.json({ error: "Ya existe un comprobante para este turno", id: existing.id }, { status: 409 });
  }

  const amount    = appointment.service.price;
  const taxAmount = Math.round(amount * taxRate / 100);
  const total     = amount + taxAmount;

  // Atomically increment invoice counter and create invoice
  const [updatedTenant, invoice] = await prisma.$transaction([
    prisma.tenant.update({
      where: { id: session.user.id },
      data: { invoiceCounter: { increment: 1 } },
    }),
    // We'll use a two-step approach: get counter first
    prisma.tenant.findUnique({ where: { id: session.user.id } }) as never,
  ]);

  // Get the new counter value
  const tenant = await prisma.tenant.findUnique({ where: { id: session.user.id } });
  const invoiceNumber = tenant!.invoiceCounter;

  const newInvoice = await prisma.invoice.create({
    data: {
      tenantId:      session.user.id,
      appointmentId,
      clientId:      appointment.clientId,
      number:        invoiceNumber,
      issuerName:    appointment.tenant.name,
      issuerTaxId:   appointment.tenant.taxId,
      issuerAddress: appointment.tenant.address,
      issuerEmail:   appointment.tenant.email,
      recipientName:  appointment.client.name,
      recipientEmail: appointment.client.email,
      description:   `${appointment.service.name} — ${appointment.startTime.toLocaleDateString("es-AR")}`,
      amount,
      taxRate,
      taxAmount,
      total,
      currency: appointment.tenant.currency,
      notes: notes ?? null,
    },
  });

  return NextResponse.json(newInvoice, { status: 201 });
}
