type Params = {
  name: string;
  tenantName: string;
  serviceName: string;
  date: string;
  bookingUrl: string;
};

export function waitlistNotificationEmail(p: Params) {
  const subject = `Se liberó un turno: ${p.serviceName} el ${p.date}`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <tr>
          <td style="background:#4f46e5;padding:32px 40px;text-align:center;">
            <p style="margin:0;color:#c7d2fe;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Lista de espera</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:700;">¡Se liberó un turno!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hola <strong>${p.name}</strong>,</p>
            <p style="margin:0 0 32px;color:#6b7280;font-size:15px;line-height:1.6;">
              Se liberó un turno de <strong style="color:#111827;">${p.serviceName}</strong> el <strong style="color:#111827;">${p.date}</strong> con <strong style="color:#111827;">${p.tenantName}</strong>.
              Reservalo antes de que se ocupe de nuevo:
            </p>
            <div style="text-align:center;margin-bottom:32px;">
              <a href="${p.bookingUrl}" style="display:inline-block;padding:14px 32px;background:#4f46e5;color:#ffffff;font-size:15px;font-weight:600;border-radius:10px;text-decoration:none;">
                Reservar ahora
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">Recibiste este email porque te anotaste en la lista de espera.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
