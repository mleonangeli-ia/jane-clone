import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status, paymentStatus } = await req.json();

  const appointment = await prisma.appointment.findUnique({
    where: { id },
  });

  if (!appointment || appointment.tenantId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(paymentStatus ? { paymentStatus } : {}),
    },
  });

  // If marking as paid manually, upsert a payment record
  if (paymentStatus === "PAID") {
    await prisma.payment.upsert({
      where: { appointmentId: id },
      create: {
        appointmentId: id,
        amount: 0,
        currency: "ars",
        status: "PAID",
      },
      update: { status: "PAID" },
    });
  }

  return NextResponse.json(updated);
}
