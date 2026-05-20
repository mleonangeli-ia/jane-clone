import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { tenantId, serviceId, date, name, email, phone } = body;

  if (!tenantId || !serviceId || !date || !name || !email) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { id: true, tenantId: true },
  });

  if (!service || service.tenantId !== tenantId) {
    return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
  }

  const existing = await prisma.waitlistEntry.findFirst({
    where: { tenantId, serviceId, date, email },
  });

  if (existing) {
    return NextResponse.json({ error: "Ya estás anotado en la lista para este día." }, { status: 409 });
  }

  await prisma.waitlistEntry.create({
    data: { tenantId, serviceId, date, name, email, phone: phone ?? null },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
