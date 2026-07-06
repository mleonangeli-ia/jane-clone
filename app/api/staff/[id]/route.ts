import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const member = await prisma.staff.findUnique({ where: { id } });
  if (!member || member.tenantId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { name, title, bio, phone, accentColor, isActive } = await req.json();

  const updated = await prisma.staff.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(title !== undefined ? { title } : {}),
      ...(bio !== undefined ? { bio } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(accentColor !== undefined ? { accentColor } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const member = await prisma.staff.findUnique({ where: { id } });
  if (!member || member.tenantId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.staff.delete({ where: { id } });

  // If no staff left, deactivate clinic mode
  const remaining = await prisma.staff.count({ where: { tenantId: session.user.id } });
  if (remaining === 0) {
    await prisma.tenant.update({ where: { id: session.user.id }, data: { isClinic: false } });
  }

  return NextResponse.json({ ok: true });
}
