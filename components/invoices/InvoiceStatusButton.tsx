"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";

export function InvoiceStatusButton({ invoiceId }: { invoiceId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function markPaid() {
    setLoading(true);
    await fetch(`/api/invoices/${invoiceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID" }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={markPaid}
      disabled={loading}
      className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-emerald-600 transition-all hover:bg-emerald-50 disabled:opacity-60"
      title="Marcar como cobrado"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
    </button>
  );
}
