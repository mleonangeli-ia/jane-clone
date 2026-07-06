import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Download, ExternalLink, Plus } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { InvoiceCreateButton } from "@/components/invoices/InvoiceCreateButton";
import { AfipAuthorizeButton } from "@/components/afip/AfipAuthorizeButton";
import { InvoiceStatusButton } from "@/components/invoices/InvoiceStatusButton";

export default async function InvoicesPage() {
  const session = await getServerSession(authOptions);
  const tenantId = session!.user.id;

  const [invoices, recentAppointments, tenant] = await Promise.all([
    prisma.invoice.findMany({
      where: { tenantId },
      orderBy: { number: "desc" },
      take: 100,
    }),
    // Turnos sin comprobante, pagados o completados
    prisma.appointment.findMany({
      where: {
        tenantId,
        status: { in: ["CONFIRMED", "COMPLETED"] },
        invoice: null,
      },
      include: { client: true, service: true },
      orderBy: { startTime: "desc" },
      take: 20,
    }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, taxId: true, taxCondition: true, address: true, email: true },
    }),
  ]);

  const totalEmitido = invoices
    .filter((i) => i.status !== "CANCELLED")
    .reduce((s, i) => s + i.total, 0);

  const pendientes = invoices.filter((i) => i.status === "ISSUED").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl" style={{ color: "var(--text)", letterSpacing: "-0.03em" }}>
            Comprobantes
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
            Generá y gestioná tus facturas y recibos
          </p>
        </div>
        <Link href="/dashboard/settings">
          <button
            className="hidden items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all sm:flex"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
          >
            Datos fiscales
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </Link>
      </div>

      {/* Alerta si faltan datos fiscales */}
      {(!tenant?.taxId || !tenant?.taxCondition) && (
        <div className="flex items-center gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-4">
          <span className="text-yellow-500 text-xl">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-800">Completá tus datos fiscales</p>
            <p className="text-xs text-yellow-600">
              Agregá tu CUIT/CUIL y condición IVA en{" "}
              <Link href="/dashboard/settings" className="underline">Configuración</Link>{" "}
              para que aparezcan en los comprobantes.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Total emitido", value: formatPrice(totalEmitido), accent: "#a78bfa" },
          { label: "Comprobantes",  value: invoices.filter(i => i.status !== "CANCELLED").length, accent: "#38bdf8" },
          { label: "Pendientes",    value: pendientes, accent: "#fb923c" },
        ].map((s) => (
          <div key={s.label} className="relative overflow-hidden rounded-2xl p-4 sm:p-5"
               style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ backgroundColor: s.accent }} />
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>{s.label}</p>
            <p className="mt-2 text-2xl font-black" style={{ color: "var(--text)", letterSpacing: "-0.03em" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Turnos sin comprobante */}
      {recentAppointments.length > 0 && (
        <div>
          <h2 className="mb-4 flex items-center gap-2 font-semibold" style={{ color: "var(--text)" }}>
            <Plus className="h-4 w-4 text-emerald-500" />
            Turnos sin comprobante
          </h2>
          <div className="space-y-2">
            {recentAppointments.map((apt) => (
              <div key={apt.id} className="flex items-center gap-4 rounded-2xl p-4"
                   style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold text-sm" style={{ color: "var(--text)" }}>
                    {apt.client.name}
                  </p>
                  <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                    {apt.service.name} · {format(apt.startTime, "d MMM yyyy", { locale: es })}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold" style={{ color: "var(--text)" }}>
                  {formatPrice(apt.service.price)}
                </span>
                <InvoiceCreateButton appointmentId={apt.id} amount={apt.service.price} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de comprobantes */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 font-semibold" style={{ color: "var(--text)" }}>
          <FileText className="h-4 w-4 text-sky-500" />
          Historial de comprobantes
        </h2>

        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center"
               style={{ borderColor: "var(--border)" }}>
            <FileText className="mb-3 h-10 w-10" style={{ color: "var(--text-faint)" }} />
            <p className="font-medium" style={{ color: "var(--text-muted)" }}>Sin comprobantes aún</p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-faint)" }}>
              Generá tu primer comprobante desde los turnos de arriba
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)" }}>
            {/* Header */}
            <div className="grid grid-cols-[60px_1fr_auto_auto_auto] gap-4 px-5 py-3 text-[10px] font-bold uppercase tracking-widest"
                 style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-faint)", borderBottom: "1px solid var(--border)" }}>
              <span>#</span>
              <span>Paciente / Servicio</span>
              <span className="text-right">Total</span>
              <span className="text-right">Estado</span>
              <span />
            </div>

            {invoices.map((inv, i) => (
              <div
                key={inv.id}
                className="grid grid-cols-[60px_1fr_auto_auto_auto] items-center gap-4 px-5 py-4"
                style={{
                  backgroundColor: "var(--bg-card)",
                  borderBottom: i < invoices.length - 1 ? "1px solid var(--border-subtle)" : "none",
                }}
              >
                <span className="text-sm font-bold tabular-nums" style={{ color: "var(--text-faint)" }}>
                  #{String(inv.number).padStart(4, "0")}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" style={{ color: "var(--text)" }}>
                    {inv.recipientName}
                  </p>
                  <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
                    {inv.description}
                  </p>
                </div>
                <span className="text-sm font-bold tabular-nums" style={{ color: "var(--text)" }}>
                  {formatPrice(inv.total)}
                </span>
                <InvoiceStatusBadge status={inv.status} />
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/invoices/${inv.id}/print`} target="_blank">
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                      style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-muted)" }}
                      title="Ver / Imprimir"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </Link>
                  {inv.status === "ISSUED" && <InvoiceStatusButton invoiceId={inv.id} />}
                  <AfipAuthorizeButton invoiceId={inv.id} hasCae={!!inv.afipCae} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
    ISSUED:    { label: "Emitido",   variant: "warning"     },
    PAID:      { label: "Cobrado",   variant: "success"     },
    CANCELLED: { label: "Anulado",   variant: "destructive" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "secondary" };
  return <Badge variant={variant}>{label}</Badge>;
}
