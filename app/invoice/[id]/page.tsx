import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyInvoiceToken } from "@/lib/invoice-token";
import { formatPrice } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ShieldCheck } from "lucide-react";

export default async function PublicInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id }    = await params;
  const { token } = await searchParams;

  if (!token) notFound();

  const invoice = await prisma.invoice.findUnique({ where: { id } });

  if (!invoice) notFound();

  // Verify token
  try {
    if (!verifyInvoiceToken(token, invoice.id, invoice.createdAt)) notFound();
  } catch {
    notFound();
  }

  // Drafts are not yet public
  if (invoice.status === "DRAFT") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <div className="mb-4 text-4xl">🔒</div>
        <h1 className="text-xl font-semibold text-gray-700">Comprobante no disponible</h1>
        <p className="mt-2 text-gray-400">Este comprobante aún no fue liberado por el profesional.</p>
      </div>
    );
  }

  const num     = String(invoice.number).padStart(4, "0");
  const fecha   = format(invoice.issuedAt, "d 'de' MMMM 'de' yyyy", { locale: es });
  const taxLabel = invoice.taxRate > 0 ? `IVA ${invoice.taxRate}%` : null;

  return (
    <>
      {/* Print button */}
      <div className="fixed top-4 right-4 z-50 print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg"
          style={{ backgroundColor: "#5a7e6a" }}
        >
          Descargar / Imprimir PDF
        </button>
      </div>

      <div className="min-h-screen bg-gray-100 px-4 py-10 print:bg-white print:p-0">
        <div className="mx-auto max-w-2xl bg-white shadow-xl print:shadow-none">

          {/* Header */}
          <div className="border-b border-gray-200 p-10 pb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-black text-gray-900" style={{ letterSpacing: "-0.04em" }}>
                  COMPROBANTE
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  N° <span className="font-bold text-gray-800">{num}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Fecha</p>
                <p className="mt-1 font-semibold text-gray-800">{fecha}</p>
                <div className="mt-2 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                  {invoice.status === "PAID" ? "COBRADO" : "EMITIDO"}
                </div>
              </div>
            </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-8 p-10 pb-8">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Emisor</p>
              <p className="font-bold text-gray-900">{invoice.issuerName}</p>
              {invoice.issuerTaxId && (
                <p className="text-sm text-gray-600">CUIT/CUIL: {invoice.issuerTaxId}</p>
              )}
              {invoice.issuerAddress && (
                <p className="text-sm text-gray-600">{invoice.issuerAddress}</p>
              )}
              <p className="text-sm text-gray-600">{invoice.issuerEmail}</p>
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Paciente</p>
              <p className="font-bold text-gray-900">{invoice.recipientName}</p>
              <p className="text-sm text-gray-600">{invoice.recipientEmail}</p>
            </div>
          </div>

          {/* Items */}
          <div className="px-10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-b border-gray-200">
                  <th className="py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-400">Concepto</th>
                  <th className="py-3 text-right text-xs font-bold uppercase tracking-widest text-gray-400">Importe</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-4 text-gray-800">{invoice.description}</td>
                  <td className="py-4 text-right font-semibold text-gray-800 tabular-nums">
                    {formatPrice(invoice.amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="px-10 py-6">
            <div className="ml-auto max-w-xs space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-800 tabular-nums">{formatPrice(invoice.amount)}</span>
              </div>
              {taxLabel && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{taxLabel}</span>
                  <span className="font-medium text-gray-800 tabular-nums">{formatPrice(invoice.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-3">
                <span className="text-base font-bold text-gray-900">TOTAL</span>
                <span className="text-xl font-black text-gray-900 tabular-nums">{formatPrice(invoice.total)}</span>
              </div>
            </div>
          </div>

          {/* AFIP CAE */}
          {invoice.afipCae && (
            <div className="mx-10 mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                      Autorizado por AFIP
                    </p>
                  </div>
                  <div className="space-y-1 text-sm text-emerald-800">
                    <p><span className="font-semibold">CAE:</span> {invoice.afipCae}</p>
                    <p><span className="font-semibold">Vto. CAE:</span> {invoice.afipCaeVenc ? format(invoice.afipCaeVenc, "dd/MM/yyyy") : ""}</p>
                    <p><span className="font-semibold">Nro.:</span> {String(invoice.afipCbteNro ?? 1).padStart(8, "0")}</p>
                  </div>
                </div>
                {invoice.afipQr && (
                  <div className="text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(invoice.afipQr)}&size=100x100`}
                      alt="QR AFIP"
                      width={100} height={100}
                      className="rounded-lg"
                    />
                    <p className="mt-1 text-[9px] text-emerald-600">Validar en AFIP</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="mx-10 mb-6 rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Notas</p>
              <p className="mt-1 text-sm text-gray-600">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-100 p-10 pt-6 text-center">
            <p className="text-xs text-gray-400">
              Comprobante emitido por <span className="font-semibold text-gray-600">JaneClone</span>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { margin: 0; size: A4; }
          .print\\:hidden { display: none !important; }
          body { margin: 0; }
        }
      `}</style>
    </>
  );
}
