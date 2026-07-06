"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Send, Loader2, ExternalLink, CheckCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils";

type Invoice = {
  id: string;
  status: string;
  number: number;
  description: string;
  notes: string | null;
  taxRate: number;
  amount: number;
  taxAmount: number;
  total: number;
  currency: string;
  recipientName: string;
  recipientEmail: string;
  issuerName: string;
  issuerTaxId: string | null;
  issuerAddress: string | null;
  issuerEmail: string;
};

export function InvoiceEditForm({
  invoice,
  invoiceUrl,
}: {
  invoice: Invoice;
  invoiceUrl: string | null;
}) {
  const router = useRouter();
  const isDraft = invoice.status === "DRAFT";

  const [saving,    setSaving]    = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [released,  setReleased]  = useState(!isDraft);
  const [pubUrl,    setPubUrl]    = useState(invoiceUrl);
  const [saveOk,    setSaveOk]    = useState(false);

  // Form state
  const [form, setForm] = useState({
    description:    invoice.description,
    notes:          invoice.notes ?? "",
    taxRate:        String(invoice.taxRate),
    recipientName:  invoice.recipientName,
    recipientEmail: invoice.recipientEmail,
    issuerTaxId:    invoice.issuerTaxId ?? "",
    issuerAddress:  invoice.issuerAddress ?? "",
  });

  // Live total preview
  const taxRateNum = parseInt(form.taxRate, 10) || 0;
  const taxAmount  = Math.round(invoice.amount * taxRateNum / 100);
  const total      = invoice.amount + taxAmount;

  function update(k: keyof typeof form, v: string) {
    setForm(f => ({ ...f, [k]: v }));
    setSaveOk(false);
  }

  async function save() {
    setSaving(true);
    await fetch(`/api/invoices/${invoice.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaveOk(true);
    router.refresh();
  }

  async function release() {
    // Auto-save first
    await fetch(`/api/invoices/${invoice.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setReleasing(true);
    const res  = await fetch(`/api/invoices/${invoice.id}/release`, { method: "POST" });
    const json = await res.json();
    setReleasing(false);

    if (res.ok) {
      setPubUrl(json.invoiceUrl);
      setReleased(true);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">

      {/* Released banner */}
      {released && pubUrl && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="font-semibold text-emerald-800">Comprobante liberado</p>
              <p className="text-sm text-emerald-600">El email fue enviado al paciente con el link de descarga.</p>
            </div>
          </div>
          <a href={pubUrl} target="_blank"
             className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white"
             style={{ backgroundColor: "#5a7e6a" }}>
            Ver como paciente
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      )}

      {/* Totals preview */}
      <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}>
        <div className="border-b px-5 py-3" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>Resumen</p>
        </div>
        <div className="space-y-2 p-5">
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
            <span className="font-medium" style={{ color: "var(--text)" }}>{formatPrice(invoice.amount)}</span>
          </div>
          {taxRateNum > 0 && (
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--text-muted)" }}>IVA {taxRateNum}%</span>
              <span className="font-medium" style={{ color: "var(--text)" }}>{formatPrice(taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-3" style={{ borderColor: "var(--border)" }}>
            <span className="font-bold" style={{ color: "var(--text)" }}>Total</span>
            <span className="text-xl font-black" style={{ color: "var(--sage)" }}>{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      {/* Concepto y notas */}
      <div className="space-y-4 rounded-2xl p-5" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>Concepto</p>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Descripción</Label>
          <Input value={form.description} onChange={e => update("description", e.target.value)} className="h-10" disabled={!isDraft} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>IVA %</Label>
            <select
              value={form.taxRate}
              onChange={e => update("taxRate", e.target.value)}
              disabled={!isDraft}
              className="h-10 w-full rounded-xl border px-3 text-sm"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text)" }}
            >
              <option value="0">Sin IVA (0%)</option>
              <option value="10">IVA 10.5%</option>
              <option value="21">IVA 21%</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
            Notas internas <span className="font-normal" style={{ color: "var(--text-faint)" }}>(opcional — aparecen en el comprobante)</span>
          </Label>
          <Input value={form.notes} onChange={e => update("notes", e.target.value)} placeholder="Ej: Sesión pagada en efectivo" className="h-10" disabled={!isDraft} />
        </div>
      </div>

      {/* Receptor */}
      <div className="space-y-4 rounded-2xl p-5" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>Datos del paciente</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Nombre</Label>
            <Input value={form.recipientName} onChange={e => update("recipientName", e.target.value)} className="h-10" disabled={!isDraft} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Email</Label>
            <Input value={form.recipientEmail} onChange={e => update("recipientEmail", e.target.value)} type="email" className="h-10" disabled={!isDraft} />
          </div>
        </div>
      </div>

      {/* Emisor */}
      <div className="space-y-4 rounded-2xl p-5" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>Datos del emisor</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>CUIT / CUIL</Label>
            <Input value={form.issuerTaxId} onChange={e => update("issuerTaxId", e.target.value)} placeholder="20-12345678-9" className="h-10" disabled={!isDraft} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Dirección</Label>
            <Input value={form.issuerAddress} onChange={e => update("issuerAddress", e.target.value)} className="h-10" disabled={!isDraft} />
          </div>
        </div>
      </div>

      {/* Actions */}
      {isDraft && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar borrador
          </button>

          {saveOk && (
            <span className="flex items-center gap-1 text-sm text-emerald-600">
              <CheckCircle className="h-4 w-4" /> Guardado
            </span>
          )}

          <button
            onClick={release}
            disabled={releasing}
            className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-60"
            style={{ backgroundColor: "var(--sage)" }}
          >
            {releasing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Liberar al paciente
          </button>
        </div>
      )}
    </div>
  );
}
