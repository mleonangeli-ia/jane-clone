import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const avail = await prisma.staffAvailability.findMany({
    where: { staffId: id },
    orderBy: { dayOfWeek: "asc" },
  });
  return NextResponse.json(avail);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const member = await prisma.staff.findUnique({ where: { id } });
  if (!member || member.tenantId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { days } = await req.json() as {
    days: Record<number, { startTime: string; endTime: string; isActive: boolean }>;
  };

  const ops = Object.entries(days).map(([day, data]) =>
    prisma.staffAvailability.upsert({
      where: { staffId_dayOfWeek: { staffId: id, dayOfWeek: Number(day) } },
      create: { staffId: id, dayOfWeek: Number(day), ...data },
      update: data,
    })
  );

  await prisma.$transaction(ops);
  return NextResponse.json({ ok: true });
}
