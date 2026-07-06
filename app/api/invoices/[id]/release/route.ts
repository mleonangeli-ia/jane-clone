import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { generateInvoiceToken } from "@/lib/invoice-token";
import { formatPrice } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { tenant: true },
  });

  if (!invoice || invoice.tenantId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if ((invoice.status as string) !== "DRAFT") {
    return NextResponse.json({ error: "El comprobante ya fue liberado" }, { status: 409 });
  }

  // Change status to ISSUED
  const updated = await prisma.invoice.update({
    where: { id },
    data: { status: "ISSUED", issuedAt: new Date() },
  });

  // Generate public URL
  const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const token      = generateInvoiceToken(updated.id, updated.createdAt);
  const invoiceUrl = `${appUrl}/invoice/${updated.id}?token=${token}`;

  // Send email to patient
  await resend.emails.send({
    from: FROM_EMAIL,
    to: invoice.recipientEmail,
    subject: `Tu comprobante N°${String(invoice.number).padStart(4,"0")} — ${invoice.tenant.name}`,
    html: invoiceEmailHtml({
      clientName:  invoice.recipientName,
      tenantName:  invoice.tenant.name,
      description: invoice.description,
      total:       formatPrice(invoice.total),
      invoiceNum:  String(invoice.number).padStart(4, "0"),
      invoiceUrl,
    }),
  });

  return NextResponse.json({ ok: true, invoiceUrl });
}

function invoiceEmailHtml(p: {
  clientName: string; tenantName: string; description: string;
  total: string; invoiceNum: string; invoiceUrl: string;
}) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f8f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e5e0d8;overflow:hidden;max-width:560px;">
        <tr>
          <td style="background:linear-gradient(135deg,#5a7e6a,#3d6452);padding:32px 40px;text-align:center;">
            <p style="margin:0;color:#a8d4b8;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;">Comprobante N°${p.invoiceNum}</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:800;">Tu comprobante está disponible</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 16px;color:#3a3028;font-size:16px;">Hola <strong>${p.clientName}</strong>,</p>
            <p style="margin:0 0 28px;color:#7a7068;font-size:15px;line-height:1.6;">
              <strong>${p.tenantName}</strong> te envía el comprobante por: <em>${p.description}</em>
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1ea;border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:16px 24px;">
                  <div style="display:flex;justify-content:space-between;">
                    <span style="color:#7a7068;font-size:14px;">Total</span>
                    <span style="color:#5a7e6a;font-weight:800;font-size:18px;">${p.total}</span>
                  </div>
                </td>
              </tr>
            </table>
            <div style="text-align:center;margin-bottom:20px;">
              <a href="${p.invoiceUrl}"
                 style="display:inline-block;background:#5a7e6a;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:12px;">
                Ver y descargar comprobante
              </a>
            </div>
            <p style="margin:0;color:#b8b0a4;font-size:12px;text-align:center;">
              Podés guardar o imprimir el comprobante como PDF desde el browser.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f5f1ea;border-top:1px solid #e5e0d8;padding:16px 40px;text-align:center;">
            <p style="margin:0;color:#b8b0a4;font-size:11px;">JaneClone · Plataforma de turnos</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
