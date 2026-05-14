import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { days } = await req.json() as {
    days: Record<number, { startTime: string; endTime: string; isActive: boolean }>;
  };

  const ops = Object.entries(days).map(([day, data]) =>
    prisma.availability.upsert({
      where: { tenantId_dayOfWeek: { tenantId: session.user.id, dayOfWeek: Number(day) } },
      create: { tenantId: session.user.id, dayOfWeek: Number(day), ...data },
      update: data,
    })
  );

  await prisma.$transaction(ops);
  return NextResponse.json({ ok: true });
}
