import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAfipToken } from "@/lib/afip/wsaa";
import { decryptPem } from "@/lib/afip/crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenant = await prisma.tenant.findUnique({ where: { id: session.user.id } });
  if (!tenant?.afipCert || !tenant.afipKey || !tenant.taxId) {
    return NextResponse.json({ ok: false, error: "Faltan datos de configuración AFIP" });
  }

  try {
    const cert = decryptPem(tenant.afipCert);
    const key  = decryptPem(tenant.afipKey);
    const cuit = tenant.taxId.replace(/[-]/g, "");
    const env  = (tenant.afipEnv ?? "homologacion") as "homologacion" | "produccion";

    await getAfipToken({ cuit, cert, key, env });
    return NextResponse.json({ ok: true, env, cuit });
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Error al conectar con AFIP" });
  }
}
