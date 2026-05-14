import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, bio, phone, address, accentColor } = await req.json();
  const tenant = await prisma.tenant.update({
    where: { id: session.user.id },
    data: { name, bio, phone, address, accentColor },
  });
  return NextResponse.json({ ok: true, slug: tenant.slug });
}
