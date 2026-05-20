import { format } from "date-fns";
import { es } from "date-fns/locale";

type Params = {
  clientName: string;
  tenantName: string;
  tenantAddress: string | null;
  serviceName: string;
  startTime: Date;
  endTime: Date;
  price: number;
  currency: string;
  bookingUrl: string;
};

export function reminderEmail(p: Params) {
  const dateStr = format(p.startTime, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
  const timeStr = `${format(p.startTime, "HH:mm")} – ${format(p.endTime, "HH:mm")}`;
  const priceStr =
    p.price > 0
      ? new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: p.currency.toUpperCase(),
          minimumFractionDigits: 0,
        }).format(p.price / 100)
      : "Gratis";

  const subject = `Recordatorio: tu turno de ${p.serviceName} es mañana`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:#4f46e5;padding:32px 40px;text-align:center;">
            <p style="margin:0;color:#c7d2fe;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Recordatorio de turno</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:700;">¡Tu turno es mañana!</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 24px;color:#374151;font-size:16px;">Hola <strong>${p.clientName}</strong>,</p>
            <p style="margin:0 0 32px;color:#6b7280;font-size:15px;line-height:1.6;">
              Te recordamos que tenés un turno confirmado para mañana con <strong style="color:#111827;">${p.tenantName}</strong>. Guardá estos datos para tenerlos a mano.
            </p>

            <!-- Details card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:32px;">
              <tr>
                <td style="padding:24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                        <span style="color:#6b7280;font-size:13px;">Servicio</span>
                        <span style="float:right;color:#111827;font-weight:600;font-size:14px;">${p.serviceName}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                        <span style="color:#6b7280;font-size:13px;">Fecha</span>
                        <span style="float:right;color:#111827;font-weight:600;font-size:14px;">${dateStr}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                        <span style="color:#6b7280;font-size:13px;">Horario</span>
                        <span style="float:right;color:#111827;font-weight:600;font-size:14px;">${timeStr}</span>
                      </td>
                    </tr>
                    ${
                      p.tenantAddress
                        ? `<tr>
                      <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                        <span style="color:#6b7280;font-size:13px;">Lugar</span>
                        <span style="float:right;color:#111827;font-weight:600;font-size:14px;">${p.tenantAddress}</span>
                      </td>
                    </tr>`
                        : ""
                    }
                    <tr>
                      <td style="padding:8px 0;">
                        <span style="color:#6b7280;font-size:13px;">Total</span>
                        <span style="float:right;color:#4f46e5;font-weight:700;font-size:15px;">${priceStr}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;color:#6b7280;font-size:13px;text-align:center;">
              Si necesitás cancelar o reprogramar, contactá al profesional.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              Este email fue enviado porque tenés una reserva en
              <a href="${p.bookingUrl}" style="color:#4f46e5;text-decoration:none;"> JaneClone</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
