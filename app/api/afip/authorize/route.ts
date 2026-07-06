import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { solicitarCAE, getUltimoComprobante } from "@/lib/afip/wsfe";
import { decryptPem, buildAfipQR } from "@/lib/afip/crypto";
import { format } from "date-fns";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { invoiceId } = await req.json();
  if (!invoiceId) return NextResponse.json({ error: "invoiceId requerido" }, { status: 400 });

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice || invoice.tenantId !== session.user.id) {
    return NextResponse.json({ error: "Comprobante no encontrado" }, { status: 404 });
  }

  if (invoice.afipCae) {
    return NextResponse.json({ error: "Este comprobante ya tiene CAE asignado", cae: invoice.afipCae }, { status: 409 });
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: session.user.id } });
  if (!tenant?.afipEnabled || !tenant.afipCert || !tenant.afipKey || !tenant.taxId) {
    return NextResponse.json({
      error: "AFIP no está configurado. Completá los datos en Configuración → AFIP.",
    }, { status: 422 });
  }

  let cert: string, key: string;
  try {
    cert = decryptPem(tenant.afipCert);
    key  = decryptPem(tenant.afipKey);
  } catch {
    return NextResponse.json({ error: "Error al leer el certificado AFIP" }, { status: 500 });
  }

  const cuit = tenant.taxId.replace(/[-]/g, "");
  const env  = (tenant.afipEnv ?? "homologacion") as "homologacion" | "produccion";
  const ptoVta  = tenant.afipPuntoVenta ?? 1;
  const tipoCmp = tenant.afipTipoComp ?? 11;

  const creds = { cuit, cert, key, env };

  try {
    // Get next invoice number from AFIP
    const ultimoNro = await getUltimoComprobante(creds, ptoVta, tipoCmp);
    const cbteNro   = ultimoNro + 1;

    const importeTotal = invoice.total / 100;
    const importeNeto  = invoice.amount / 100;
    const importeIVA   = invoice.taxAmount / 100;

    const { cae, caeVenc, cbteNro: nroAutorizado } = await solicitarCAE(creds, {
      cuit,
      puntoVenta:   ptoVta,
      tipoComp:     tipoCmp,
      cbteDesde:    cbteNro,
      cbteHasta:    cbteNro,
      concepto:     2,  // Servicios
      importeTotal,
      importeNeto,
      importeIVA,
      alicuotaIVA:  invoice.taxRate,
      moneda:       "PES",
      fechaCbte:    invoice.issuedAt,
    });

    // Build AFIP QR
    const qr = buildAfipQR({
      ver: 1,
      fecha: format(invoice.issuedAt, "yyyy-MM-dd"),
      cuit: parseInt(cuit, 10),
      ptoVta,
      tipoCmp,
      nroCmp: nroAutorizado,
      importe: importeTotal,
      moneda: "PES",
      ctz: 1,
      tipoDocRec: 99,
      nroDocRec: 0,
      tipoCodAut: "E",
      codAut: parseInt(cae, 10),
    });

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        afipCae:     cae,
        afipCaeVenc: caeVenc,
        afipTipoComp: tipoCmp,
        afipPtoVta:  ptoVta,
        afipCbteNro: nroAutorizado,
        afipQr:      qr,
        status:      "ISSUED",
      },
    });

    return NextResponse.json({ cae, caeVenc, cbteNro: nroAutorizado, qr });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
