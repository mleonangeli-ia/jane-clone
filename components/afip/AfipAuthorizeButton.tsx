"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2, AlertCircle } from "lucide-react";

export function AfipAuthorizeButton({ invoiceId, hasCae }: { invoiceId: string; hasCae: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const router = useRouter();

  if (hasCae) {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
        <ShieldCheck className="h-3.5 w-3.5" /> CAE
      </span>
    );
  }

  async function authorize() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/afip/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || "Error");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={authorize}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all disabled:opacity-60"
        style={{ backgroundColor: "var(--sage)" }}
        title="Autorizar en AFIP"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
        AFIP
      </button>
      {error && (
        <div className="mt-1 flex items-start gap-1 text-xs text-red-500 max-w-xs">
          <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
