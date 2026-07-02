import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { consume, getClientIp } from "@/lib/rate-limit";
import crypto from "crypto";
import { addMinutes } from "date-fns";

// 5 solicitudes por IP por hora
const RATE = { max: 5, windowMs: 60 * 60_000 };

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!consume(`patient-login:${ip}`, RATE.max, RATE.windowMs).allowed) {
    return NextResponse.json({ ok: true }); // respuesta idéntica
  }

  const { email } = await req.json().catch(() => ({}));
  if (!email || typeof email !== "string") {
    return NextResponse.json({ ok: true });
  }

  // Buscar todos los clientes con ese email (puede tener citas con varios profesionales)
  const clients = await prisma.client.findMany({
    where: { email: email.toLowerCase().trim() },
    include: { tenant: { select: { name: true } } },
  });

  if (clients.length === 0) return NextResponse.json({ ok: true });

  // Usar el primer cliente (el portal agrupa todos sus turnos)
  const client = clients[0];

  // Invalida tokens anteriores no usados
  await prisma.patientMagicToken.deleteMany({
    where: { clientId: client.id, usedAt: null },
  });

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  await prisma.patientMagicToken.create({
    data: { clientId: client.id, tokenHash, expiresAt: addMinutes(new Date(), 15) },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const loginUrl = `${appUrl}/api/patient/auth/verify?token=${rawToken}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: client.email,
    subject: "Tu acceso al portal de turnos — JaneClone",
    html: magicLinkEmail({ name: client.name, loginUrl }),
  });

  return NextResponse.json({ ok: true });
}

function magicLinkEmail({ name, loginUrl }: { name: string; loginUrl: string }) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;max-width:560px;">
        <tr>
          <td style="background:linear-gradient(135deg,#38bdf8,#0ea5e9);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Acceso a tu portal</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hola <strong>${name}</strong>,</p>
            <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6;">
              Hacé clic en el botón para acceder a tu historial de turnos. El link es válido por <strong>15 minutos</strong>.
            </p>
            <div style="text-align:center;margin-bottom:28px;">
              <a href="${loginUrl}"
                 style="display:inline-block;background:#0ea5e9;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">
                Acceder a mis turnos
              </a>
            </div>
            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
              Si no solicitaste este acceso, ignorá este email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 40px;text-align:center;">
            <p style="margin:0;color:#d1d5db;font-size:11px;">JaneClone · Portal del paciente</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
