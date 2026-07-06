import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { generateInvoiceToken } from "@/lib/invoice-token";
import { formatPrice } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// GET — list all invoices for this tenant
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invoices = await prisma.invoice.findMany({
    where: { tenantId: session.user.id },
    orderBy: { number: "desc" },
    take: 100,
  });

  return NextResponse.json(invoices);
}

// POST — create invoice from an appointment
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { appointmentId, taxRate = 0, notes } = await req.json();

  if (!appointmentId) {
    return NextResponse.json({ error: "appointmentId requerido" }, { status: 400 });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { client: true, service: true, tenant: true },
  });

  if (!appointment || appointment.tenantId !== session.user.id) {
    return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
  }

  // Check if invoice already exists for this appointment
  const existing = await prisma.invoice.findUnique({
    where: { appointmentId },
  });
  if (existing) {
    return NextResponse.json({ error: "Ya existe un comprobante para este turno", id: existing.id }, { status: 409 });
  }

  const amount    = appointment.service.price;
  const taxAmount = Math.round(amount * taxRate / 100);
  const total     = amount + taxAmount;

  // Atomically increment invoice counter and create invoice
  const [updatedTenant, invoice] = await prisma.$transaction([
    prisma.tenant.update({
      where: { id: session.user.id },
      data: { invoiceCounter: { increment: 1 } },
    }),
    // We'll use a two-step approach: get counter first
    prisma.tenant.findUnique({ where: { id: session.user.id } }) as never,
  ]);

  // Get the new counter value
  const tenant = await prisma.tenant.findUnique({ where: { id: session.user.id } });
  const invoiceNumber = tenant!.invoiceCounter;

  const newInvoice = await prisma.invoice.create({
    data: {
      tenantId:      session.user.id,
      appointmentId,
      clientId:      appointment.clientId,
      number:        invoiceNumber,
      status:        "DRAFT" as const,
      issuerName:    appointment.tenant.name,
      issuerTaxId:   appointment.tenant.taxId,
      issuerAddress: appointment.tenant.address,
      issuerEmail:   appointment.tenant.email,
      recipientName:  appointment.client.name,
      recipientEmail: appointment.client.email,
      description:   `${appointment.service.name} — ${appointment.startTime.toLocaleDateString("es-AR")}`,
      amount,
      taxRate,
      taxAmount,
      total,
      currency: appointment.tenant.currency,
      notes: notes ?? null,
    },
  });

  // Draft created — redirect to edit page, email sent on release
  const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const editUrl = `${appUrl}/dashboard/invoices/${newInvoice.id}`;

  return NextResponse.json({ ...newInvoice, editUrl }, { status: 201 });
}

function invoiceEmailHtml(p: {
  clientName: string; tenantName: string; serviceName: string;
  fecha: string; total: string; invoiceNum: string; invoiceUrl: string;
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
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:800;">Tu comprobante está listo</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 16px;color:#3a3028;font-size:16px;">Hola <strong>${p.clientName}</strong>,</p>
            <p style="margin:0 0 28px;color:#7a7068;font-size:15px;line-height:1.6;">
              ${p.tenantName} emitió tu comprobante por la atención del <strong>${p.fecha}</strong>.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1ea;border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;border-bottom:1px solid #e5e0d8;">
                        <span style="color:#7a7068;font-size:13px;">Servicio</span>
                        <span style="float:right;color:#1a1814;font-weight:600;font-size:14px;">${p.serviceName}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;">
                        <span style="color:#7a7068;font-size:13px;">Total</span>
                        <span style="float:right;color:#5a7e6a;font-weight:800;font-size:16px;">${p.total}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <div style="text-align:center;margin-bottom:24px;">
              <a href="${p.invoiceUrl}"
                 style="display:inline-block;background:#5a7e6a;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:12px;">
                Ver y descargar comprobante
              </a>
            </div>

            <p style="margin:0;color:#b8b0a4;font-size:12px;text-align:center;">
              El link es válido permanentemente. Podés guardar o imprimir el comprobante desde la página.
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
