import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getClientIp } from "@/lib/rate-limit";
import { checkWaitlistRateLimit, isDisposableEmail, isHoneypotClean } from "@/lib/abuse";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { tenantId, serviceId, date, name, email, phone, _hp } = body;

  // Abuse checks
  if (!isHoneypotClean(_hp)) {
    return NextResponse.json({ ok: true }); // silently discard
  }
  if (email && isDisposableEmail(email)) {
    return NextResponse.json({ error: "Email no permitido." }, { status: 422 });
  }
  const wlLimit = checkWaitlistRateLimit(ip);
  if (!wlLimit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

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
