import { format } from "date-fns";
import { es } from "date-fns/locale";

type Params = {
  tenantName: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  serviceName: string;
  startTime: Date;
  endTime: Date;
  notes: string | null;
  dashboardUrl: string;
};

export function professionalNotificationEmail(p: Params) {
  const dateStr = format(p.startTime, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
  const timeStr = `${format(p.startTime, "HH:mm")} – ${format(p.endTime, "HH:mm")}`;

  const subject = `Nueva reserva: ${p.clientName} – ${p.serviceName}`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:#059669;padding:28px 40px;text-align:center;">
            <p style="margin:0;color:#a7f3d0;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Nueva reserva</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;">Tenés un nuevo turno</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 24px;color:#374151;font-size:16px;">Hola <strong>${p.tenantName}</strong>,</p>
            <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6;">
              <strong style="color:#111827;">${p.clientName}</strong> reservó un turno de <strong style="color:#111827;">${p.serviceName}</strong>.
            </p>

            <!-- Client info -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:24px;">
              <tr><td style="padding:16px 24px 8px;"><p style="margin:0;color:#374151;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Datos del cliente</p></td></tr>
              <tr>
                <td style="padding:4px 24px 16px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;border-bottom:1px solid #e5e7eb;">
                        <span style="color:#6b7280;font-size:13px;">Nombre</span>
                        <span style="float:right;color:#111827;font-weight:600;font-size:14px;">${p.clientName}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;border-bottom:1px solid #e5e7eb;">
                        <span style="color:#6b7280;font-size:13px;">Email</span>
                        <span style="float:right;font-size:14px;"><a href="mailto:${p.clientEmail}" style="color:#4f46e5;text-decoration:none;">${p.clientEmail}</a></span>
                      </td>
                    </tr>
                    ${
                      p.clientPhone
                        ? `<tr>
                      <td style="padding:6px 0;">
                        <span style="color:#6b7280;font-size:13px;">Teléfono</span>
                        <span style="float:right;color:#111827;font-weight:600;font-size:14px;">${p.clientPhone}</span>
                      </td>
                    </tr>`
                        : ""
                    }
                  </table>
                </td>
              </tr>
            </table>

            <!-- Appointment info -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:32px;">
              <tr><td style="padding:16px 24px 8px;"><p style="margin:0;color:#374151;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Detalles del turno</p></td></tr>
              <tr>
                <td style="padding:4px 24px 16px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;border-bottom:1px solid #e5e7eb;">
                        <span style="color:#6b7280;font-size:13px;">Servicio</span>
                        <span style="float:right;color:#111827;font-weight:600;font-size:14px;">${p.serviceName}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;border-bottom:1px solid #e5e7eb;">
                        <span style="color:#6b7280;font-size:13px;">Fecha</span>
                        <span style="float:right;color:#111827;font-weight:600;font-size:14px;">${dateStr}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0${p.notes ? ";border-bottom:1px solid #e5e7eb" : ""};">
                        <span style="color:#6b7280;font-size:13px;">Horario</span>
                        <span style="float:right;color:#111827;font-weight:600;font-size:14px;">${timeStr}</span>
                      </td>
                    </tr>
                    ${
                      p.notes
                        ? `<tr>
                      <td style="padding:6px 0;">
                        <span style="color:#6b7280;font-size:13px;">Notas</span>
                        <span style="float:right;color:#374151;font-size:14px;max-width:300px;text-align:right;">${p.notes}</span>
                      </td>
                    </tr>`
                        : ""
                    }
                  </table>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${p.dashboardUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">
                    Ver en el dashboard
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">JaneClone — Plataforma de turnos online</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
