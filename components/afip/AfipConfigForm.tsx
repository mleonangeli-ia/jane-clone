"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, AlertCircle, Wifi } from "lucide-react";

type Props = {
  initial: {
    enabled:    boolean;
    env:        "homologacion" | "produccion";
    puntoVenta: number;
    tipoComp:   number;
    hasCert:    boolean;
  };
  tipoCompOptions: { value: number; label: string }[];
};

export function AfipConfigForm({ initial, tipoCompOptions }: Props) {
  const router = useRouter();
  const [saving, setSaving]     = useState(false);
  const [testing, setTesting]   = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [cert, setCert]         = useState("");
  const [key,  setKey]          = useState("");
  const [env,  setEnv]          = useState(initial.env);
  const [ptoVta, setPtoVta]     = useState(String(initial.puntoVenta));
  const [tipoComp, setTipoComp] = useState(String(initial.tipoComp));
  const [success, setSuccess]   = useState(false);

  async function save() {
    setSaving(true);
    setSuccess(false);
    await fetch("/api/afip/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cert: cert || undefined, key: key || undefined, env, puntoVenta: ptoVta, tipoComp, enabled: true }),
    });
    setSaving(false);
    setSuccess(true);
    router.refresh();
  }

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    const res = await fetch("/api/afip/status");
    const json = await res.json();
    setTestResult({ ok: json.ok, msg: json.ok ? `Conectado a AFIP (${json.env}) — CUIT ${json.cuit}` : json.error });
    setTesting(false);
  }

  async function disconnect() {
    if (!confirm("¿Desconectar AFIP? Se eliminarán el certificado y la clave almacenados.")) return;
    await fetch("/api/afip/config", { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Environment */}
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
          Ambiente
        </Label>
        <div className="flex gap-3">
          {(["homologacion", "produccion"] as const).map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEnv(e)}
              className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-all"
              style={{
                border: "1px solid var(--border)",
                backgroundColor: env === e ? "var(--sage-light)" : "var(--bg-card)",
                color: env === e ? "var(--sage-dark)" : "var(--text-muted)",
                fontWeight: env === e ? 700 : 400,
              }}
            >
              {e === "homologacion" ? "🧪 Homologación (test)" : "🚀 Producción"}
            </button>
          ))}
        </div>
        {env === "produccion" && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            ⚠️ En producción los comprobantes son válidos legalmente y no se pueden anular fácilmente.
          </p>
        )}
      </div>

      {/* Punto de venta + tipo */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
            Punto de Venta
          </Label>
          <Input value={ptoVta} onChange={e => setPtoVta(e.target.value)} type="number" min="1" className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
            Tipo de Comprobante
          </Label>
          <select
            value={tipoComp}
            onChange={e => setTipoComp(e.target.value)}
            className="h-10 w-full rounded-xl border px-3 text-sm"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text)" }}
          >
            {tipoCompOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Certificate */}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
          Certificado (.crt / .pem) {initial.hasCert && <span className="text-emerald-500 font-normal">— ya cargado</span>}
        </Label>
        <textarea
          value={cert}
          onChange={e => setCert(e.target.value)}
          placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
          rows={5}
          className="w-full rounded-xl border px-3 py-2.5 font-mono text-xs"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text)", resize: "vertical" }}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
          Clave Privada (.key / .pem) {initial.hasCert && <span className="text-emerald-500 font-normal">— ya cargada</span>}
        </Label>
        <textarea
          value={key}
          onChange={e => setKey(e.target.value)}
          placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
          rows={5}
          className="w-full rounded-xl border px-3 py-2.5 font-mono text-xs"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text)", resize: "vertical" }}
        />
      </div>

      {/* Test result */}
      {testResult && (
        <div className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${testResult.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
          {testResult.ok ? <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />}
          {testResult.msg}
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" /> Configuración guardada
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-60"
          style={{ backgroundColor: "var(--sage)" }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Guardar configuración
        </button>

        {initial.hasCert && (
          <button
            onClick={testConnection}
            disabled={testing}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
          >
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wifi className="h-4 w-4" />}
            Probar conexión
          </button>
        )}

        {initial.enabled && (
          <button
            onClick={disconnect}
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
          >
            Desconectar AFIP
          </button>
        )}
      </div>
    </div>
  );
}
