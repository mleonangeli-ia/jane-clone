import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCancelToken } from "@/lib/cancel-token";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { differenceInHours } from "date-fns";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { notifyWaitlist } from "@/lib/notifications/waitlist";
import { deleteCalendarEvent } from "@/lib/google-calendar";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { id, token } = body;
  if (!id || !token) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { tenant: true, client: true, service: true },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
  }

  if (!verifyCancelToken(token, id, appointment.createdAt)) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  if (appointment.status === "CANCELLED") {
    return NextResponse.json({ error: "El turno ya fue cancelado" }, { status: 409 });
  }

  if (appointment.startTime < new Date()) {
    return NextResponse.json({ error: "El turno ya ocurrió" }, { status: 400 });
  }

  const hoursLeft = differenceInHours(appointment.startTime, new Date());
  if (hoursLeft < appointment.tenant.cancelWindowHours) {
    return NextResponse.json({ error: "El plazo para cancelar venció" }, { status: 400 });
  }

  await prisma.appointment.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  notifyWaitlist(appointment.tenantId, appointment.serviceId, appointment.startTime, appUrl).catch(console.error);

  if (appointment.googleEventId && appointment.tenant.googleRefreshToken) {
    deleteCalendarEvent(appointment.googleEventId, appointment.tenant.googleRefreshToken).catch(console.error);
  }

  const dateStr = format(appointment.startTime, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
  const timeStr = `${format(appointment.startTime, "HH:mm")} – ${format(appointment.endTime, "HH:mm")}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: appointment.tenant.email,
    subject: `Cancelación: ${appointment.client.name} – ${appointment.service.name}`,
    html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <tr>
          <td style="background:#ef4444;padding:32px 40px;text-align:center;">
            <p style="margin:0;color:#fecaca;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Cancelación</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:700;">Turno cancelado por el cliente</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 24px;color:#374151;font-size:15px;">
              <strong>${appointment.client.name}</strong> canceló su turno.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;">
              <tr>
                <td style="padding:24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                        <span style="color:#6b7280;font-size:13px;">Cliente</span>
                        <span style="float:right;color:#111827;font-weight:600;font-size:14px;">${appointment.client.name}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                        <span style="color:#6b7280;font-size:13px;">Email</span>
                        <span style="float:right;color:#111827;font-weight:600;font-size:14px;">${appointment.client.email}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                        <span style="color:#6b7280;font-size:13px;">Servicio</span>
                        <span style="float:right;color:#111827;font-weight:600;font-size:14px;">${appointment.service.name}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                        <span style="color:#6b7280;font-size:13px;">Fecha</span>
                        <span style="float:right;color:#111827;font-weight:600;font-size:14px;">${dateStr}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;">
                        <span style="color:#6b7280;font-size:13px;">Horario</span>
                        <span style="float:right;color:#111827;font-weight:600;font-size:14px;">${timeStr}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">El horario quedó disponible para nuevas reservas.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }).catch(console.error);

  return NextResponse.json({ ok: true });
}
