import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatPrice } from "@/lib/utils";

export default async function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id } });

  if (!invoice || invoice.tenantId !== session.user.id) notFound();

  const num = String(invoice.number).padStart(4, "0");
  const fecha = format(invoice.issuedAt, "d 'de' MMMM 'de' yyyy", { locale: es });
  const taxLabel = invoice.taxRate > 0 ? `IVA ${invoice.taxRate}%` : null;

  return (
    <>
      {/* Print trigger + back button */}
      <div className="fixed top-4 right-4 flex gap-2 print:hidden z-50">
        <a href="/dashboard/invoices"
           className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50">
          ← Volver
        </a>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800"
        >
          Imprimir / PDF
        </button>
      </div>

      {/* Invoice */}
      <div className="min-h-screen bg-gray-100 p-8 print:bg-white print:p-0">
        <div
          className="mx-auto max-w-2xl bg-white shadow-xl print:shadow-none"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
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
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Fecha de emisión</p>
                <p className="mt-1 font-semibold text-gray-800">{fecha}</p>
                <div className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${
                  invoice.status === "PAID"      ? "bg-emerald-100 text-emerald-700" :
                  invoice.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                                                   "bg-yellow-100 text-yellow-700"
                }`}>
                  {invoice.status === "PAID" ? "COBRADO" : invoice.status === "CANCELLED" ? "ANULADO" : "EMITIDO"}
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

          {/* Items table */}
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
              <div className="text-right text-xs text-gray-400">
                {invoice.currency.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mx-10 mb-6 rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Notas</p>
              <p className="mt-1 text-sm text-gray-600">{invoice.notes}</p>
            </div>
          )}

          {/* AFIP CAE section */}
          {invoice.afipCae && (
            <div className="mx-10 mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                    Comprobante Autorizado por AFIP
                  </p>
                  <div className="mt-2 space-y-1 text-sm text-emerald-800">
                    <p><span className="font-semibold">CAE:</span> {invoice.afipCae}</p>
                    <p><span className="font-semibold">Vto. CAE:</span> {invoice.afipCaeVenc ? format(invoice.afipCaeVenc, "dd/MM/yyyy") : ""}</p>
                    <p><span className="font-semibold">Pto. Venta:</span> {String(invoice.afipPtoVta ?? 1).padStart(5, "0")}</p>
                    <p><span className="font-semibold">Nro. Comprobante:</span> {String(invoice.afipCbteNro ?? 1).padStart(8, "0")}</p>
                  </div>
                </div>
                {invoice.afipQr && (
                  <div className="text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(invoice.afipQr)}&size=100x100`}
                      alt="QR AFIP"
                      width={100}
                      height={100}
                      className="rounded-lg"
                    />
                    <p className="mt-1 text-[9px] text-emerald-600">Ver en AFIP</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-100 p-10 pt-6 text-center">
            <p className="text-xs text-gray-400">
              Comprobante generado por{" "}
              <span className="font-semibold text-gray-600">JaneClone</span>
              {" "}· janeclone.vercel.app
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { margin: 0; size: A4; }
          .fixed { display: none !important; }
          body { margin: 0; }
        }
      `}</style>
    </>
  );
}
