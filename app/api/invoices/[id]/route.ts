import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice || invoice.tenantId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(invoice);
}

// Update editable fields on a DRAFT invoice
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice || invoice.tenantId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const {
    status,
    description,
    notes,
    taxRate,
    recipientName,
    recipientEmail,
    issuerTaxId,
    issuerAddress,
  } = await req.json();

  // Recompute totals if taxRate changed
  let taxAmount = invoice.taxAmount;
  let total     = invoice.total;
  if (taxRate !== undefined) {
    const rate = parseInt(taxRate, 10) || 0;
    taxAmount  = Math.round(invoice.amount * rate / 100);
    total      = invoice.amount + taxAmount;
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      ...(status       !== undefined ? { status }       : {}),
      ...(description  !== undefined ? { description }  : {}),
      ...(notes        !== undefined ? { notes }        : {}),
      ...(taxRate      !== undefined ? { taxRate: parseInt(taxRate, 10) || 0, taxAmount, total } : {}),
      ...(recipientName  !== undefined ? { recipientName }  : {}),
      ...(recipientEmail !== undefined ? { recipientEmail } : {}),
      ...(issuerTaxId    !== undefined ? { issuerTaxId }    : {}),
      ...(issuerAddress  !== undefined ? { issuerAddress }  : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice || invoice.tenantId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.invoice.update({ where: { id }, data: { status: "CANCELLED" } });
  return NextResponse.json({ ok: true });
}
