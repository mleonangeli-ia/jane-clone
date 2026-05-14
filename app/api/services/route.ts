import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const services = await prisma.service.findMany({
    where: { tenantId: session.user.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, duration, price, color } = await req.json();
  if (!name || !duration || price === undefined) {
    return NextResponse.json({ error: "Datos requeridos faltantes" }, { status: 400 });
  }

  const service = await prisma.service.create({
    data: { tenantId: session.user.id, name, description, duration, price, color: color ?? "#4F46E5" },
  });
  return NextResponse.json(service, { status: 201 });
}
