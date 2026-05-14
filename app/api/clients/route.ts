import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clients = await prisma.client.findMany({
    where: { tenantId: session.user.id },
    include: { _count: { select: { appointments: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(clients);
}
