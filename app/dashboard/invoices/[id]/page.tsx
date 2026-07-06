import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { InvoiceEditForm } from "@/components/invoices/InvoiceEditForm";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { generateInvoiceToken } from "@/lib/invoice-token";
import { Badge } from "@/components/ui/badge";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice || invoice.tenantId !== session.user.id) notFound();

  const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const token      = generateInvoiceToken(invoice.id, invoice.createdAt);
  const invoiceUrl = invoice.status !== "DRAFT"
    ? `${appUrl}/invoice/${invoice.id}?token=${token}`
    : null;

  const statusBadge = {
    DRAFT:     { label: "Borrador",  variant: "warning"   as const },
    ISSUED:    { label: "Emitido",   variant: "success"   as const },
    PAID:      { label: "Cobrado",   variant: "success"   as const },
    CANCELLED: { label: "Anulado",   variant: "destructive" as const },
  }[invoice.status] ?? { label: invoice.status, variant: "secondary" as const };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/invoices" className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-muted)" }}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold" style={{ color: "var(--text)", letterSpacing: "-0.03em" }}>
                Comprobante #{String(invoice.number).padStart(4, "0")}
              </h1>
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {invoice.recipientName} · {invoice.description}
            </p>
          </div>
        </div>
        {invoiceUrl && (
          <Link href={`/dashboard/invoices/${id}/print`} target="_blank">
            <button
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              <FileText className="h-4 w-4" />
              Vista de impresión
            </button>
          </Link>
        )}
      </div>

      {/* Edit form */}
      <InvoiceEditForm invoice={invoice} invoiceUrl={invoiceUrl} />
    </div>
  );
}
