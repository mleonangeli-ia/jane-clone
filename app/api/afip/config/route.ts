import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encryptPem } from "@/lib/afip/crypto";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cert, key, puntoVenta, tipoComp, env, enabled } = await req.json();

  const data: Record<string, unknown> = {
    afipEnabled:    enabled ?? true,
    afipEnv:        env ?? "homologacion",
    afipPuntoVenta: parseInt(puntoVenta ?? "1", 10),
    afipTipoComp:   parseInt(tipoComp ?? "11", 10),
  };

  if (cert?.trim()) data.afipCert = encryptPem(cert.trim());
  if (key?.trim())  data.afipKey  = encryptPem(key.trim());

  await prisma.tenant.update({ where: { id: session.user.id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.tenant.update({
    where: { id: session.user.id },
    data: { afipEnabled: false, afipCert: null, afipKey: null },
  });
  return NextResponse.json({ ok: true });
}
