import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.tenant.update({
    where: { id: session.user.id },
    data: { googleRefreshToken: null },
  });

  return NextResponse.json({ ok: true });
}
