import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { consume, getClientIp } from "@/lib/rate-limit";
import crypto from "crypto";
import { addHours } from "date-fns";

// 3 intentos por IP por hora — evita enumeración masiva de emails
const RATE = { max: 3, windowMs: 60 * 60_000 };

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!consume(`forgot:ip:${ip}`, RATE.max, RATE.windowMs).allowed) {
    return NextResponse.json({ ok: true }); // respuesta idéntica para no dar info
  }

  const { email } = await req.json().catch(() => ({}));
  if (!email || typeof email !== "string") {
    return NextResponse.json({ ok: true }); // siempre responde ok (no revelar si existe)
  }

  const tenant = await prisma.tenant.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  // Si no existe, responde igual para no revelar emails registrados
  if (!tenant) return NextResponse.json({ ok: true });

  // Invalida tokens anteriores no usados para este tenant
  await prisma.passwordResetToken.deleteMany({
    where: { tenantId: tenant.id, usedAt: null },
  });

  // Genera token seguro
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = addHours(new Date(), 1);

  await prisma.passwordResetToken.create({
    data: { tenantId: tenant.id, tokenHash, expiresAt },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: tenant.email,
    subject: "Recuperar contraseña — JaneClone",
    html: resetPasswordEmail({ name: tenant.name, resetUrl }),
  });

  return NextResponse.json({ ok: true });
}

function resetPasswordEmail({ name, resetUrl }: { name: string; resetUrl: string }) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;max-width:560px;">
        <tr>
          <td style="background:linear-gradient(135deg,#38bdf8,#0284c7);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Recuperar contraseña</h1>
            <p style="margin:8px 0 0;color:#e0f2fe;font-size:14px;">JaneClone</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hola <strong>${name}</strong>,</p>
            <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6;">
              Recibimos una solicitud para restablecer la contraseña de tu cuenta.
              Hacé clic en el botón para crear una nueva.
            </p>
            <div style="text-align:center;margin-bottom:28px;">
              <a href="${resetUrl}"
                 style="display:inline-block;background:#0284c7;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">
                Restablecer contraseña
              </a>
            </div>
            <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;text-align:center;">
              Este link expira en <strong>1 hora</strong>.
            </p>
            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
              Si no pediste esto, ignorá este email. Tu contraseña no cambiará.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 40px;text-align:center;">
            <p style="margin:0;color:#d1d5db;font-size:11px;">JaneClone · Plataforma de turnos online</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
