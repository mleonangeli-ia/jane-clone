import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { intakeFormId, isVirtual, name, description, duration, price, color, isActive } = await req.json();

  const service = await prisma.service.findUnique({ where: { id } });
  if (!service || service.tenantId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.service.update({
    where: { id },
    data: {
      ...(intakeFormId !== undefined ? { intakeFormId: intakeFormId ?? null } : {}),
      ...(isVirtual    !== undefined ? { isVirtual }    : {}),
      ...(name         !== undefined ? { name }         : {}),
      ...(description  !== undefined ? { description }  : {}),
      ...(duration     !== undefined ? { duration }     : {}),
      ...(price        !== undefined ? { price }        : {}),
      ...(color        !== undefined ? { color }        : {}),
      ...(isActive     !== undefined ? { isActive }     : {}),
    },
  });

  return NextResponse.json(updated);
}
