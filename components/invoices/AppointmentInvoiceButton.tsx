"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, ExternalLink, CheckCircle } from "lucide-react";

export function AppointmentInvoiceButton({
  appointmentId,
  servicePrice,
  existingInvoiceId,
}: {
  appointmentId:    string;
  servicePrice:     number;
  existingInvoiceId?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [url,     setUrl]     = useState<string | null>(null);
  const [error,   setError]   = useState("");

  // Already invoiced → show link
  if (existingInvoiceId && !done) {
    return (
      <a
        href={`/dashboard/invoices`}
        className="flex items-center gap-1 text-xs font-medium transition-colors"
        style={{ color: "var(--blue)" }}
      >
        <FileText className="h-3.5 w-3.5" />
        Ver comprobante
      </a>
    );
  }

  if (done && url) {
    return (
      <div className="flex items-center gap-1.5">
        <CheckCircle className="h-3.5 w-3.5 text-blue-500" />
        <a href={url} target="_blank" className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-0.5">
          Comprobante enviado <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  }

  async function createInvoice() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (res.status === 409 && json.id) {
        // Already exists — redirect to invoices
        router.push("/dashboard/invoices");
        return;
      }
      setError(json.error || "Error al generar comprobante");
      return;
    }

    // Redirect to the invoice edit page
    if (json.id || json.editUrl) {
      router.push(json.editUrl ?? `/dashboard/invoices/${json.id}`);
      return;
    }
    setUrl(json.invoiceUrl ?? null);
    setDone(true);
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={createInvoice}
        disabled={loading || servicePrice === 0}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all disabled:opacity-40"
        style={{ backgroundColor: "var(--sage-light)", color: "var(--sage-dark)" }}
        title={servicePrice === 0 ? "Servicio gratuito — no requiere comprobante" : "Generar comprobante"}
      >
        {loading
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <FileText className="h-3.5 w-3.5" />
        }
        Facturar
      </button>
      {error && <p className="mt-1 text-xs text-red-500 max-w-[140px]">{error}</p>}
    </div>
  );
}
