import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendPushToTenant } from "@/lib/push/send";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await sendPushToTenant(session.user.id, {
    title: "🔔 Notificaciones activas",
    body:  "Las notificaciones push están funcionando correctamente.",
    url:   "/dashboard",
  });

  return NextResponse.json({ ok: true });
}
