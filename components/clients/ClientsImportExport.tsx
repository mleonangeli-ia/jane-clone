"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload, Loader2, CheckCircle, AlertCircle, X } from "lucide-react";

type ImportResult = {
  created: number;
  updated: number;
  skipped: number;
  errors:  string[];
};

export function ClientsExportButton() {
  const [loading, setLoading] = useState(false);

  async function exportCsv() {
    setLoading(true);
    const res  = await fetch("/api/clients/export");
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    const cd   = res.headers.get("Content-Disposition") ?? "";
    const name = cd.match(/filename="(.+)"/)?.[1] ?? "clientes.csv";
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
    setLoading(false);
  }

  return (
    <button
      onClick={exportCsv}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all disabled:opacity-60"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      Exportar CSV
    </button>
  );
}

export function ClientsImportButton() {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<ImportResult | null>(null);
  const [error,   setError]   = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router   = useRouter();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);

    const form = new FormData();
    form.append("file", file);

    const res  = await fetch("/api/clients/import", { method: "POST", body: form });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) { setError(json.error || "Error al importar"); return; }
    setResult(json);
    router.refresh();
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setResult(null); setError(""); }}
        className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
      >
        <Upload className="h-4 w-4" />
        Importar CSV
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl shadow-2xl"
               style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
            {/* Header */}
            <div className="flex items-center justify-between border-b px-5 py-4"
                 style={{ borderColor: "var(--border)" }}>
              <div>
                <p className="font-semibold" style={{ color: "var(--text)" }}>Importar clientes</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  El archivo debe tener columnas: Nombre, Email (requeridas), Teléfono, Notas (opcionales)
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 transition-colors"
                      style={{ color: "var(--text-faint)" }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Format example */}
              <div className="rounded-xl p-3 font-mono text-xs overflow-x-auto"
                   style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-muted)" }}>
                Nombre,Email,Teléfono,Notas<br/>
                Juan Pérez,juan@mail.com,+54 11 1234,Cliente frecuente<br/>
                Ana García,ana@mail.com,,
              </div>

              {/* Drop area / file input */}
              <label
                className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 py-8 cursor-pointer transition-all hover:opacity-80"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-subtle)" }}
              >
                {loading
                  ? <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#2563eb" }} />
                  : <Upload className="h-8 w-8" style={{ color: "var(--text-faint)" }} />
                }
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {loading ? "Importando..." : "Hacé click o arrastrá tu archivo CSV"}
                </span>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleFile}
                  disabled={loading}
                />
              </label>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              {/* Result */}
              {result && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Creados",      value: result.created, color: "#2563eb" },
                      { label: "Actualizados", value: result.updated, color: "#60a5fa" },
                      { label: "Omitidos",     value: result.skipped, color: "var(--text-faint)" },
                    ].map(s => (
                      <div key={s.label} className="rounded-xl p-3 text-center"
                           style={{ backgroundColor: "var(--bg-subtle)" }}>
                        <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {result.errors.length > 0 && (
                    <div className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-700 space-y-1">
                      <p className="font-semibold">Filas con problemas:</p>
                      {result.errors.slice(0, 5).map((e, i) => <p key={i}>• {e}</p>)}
                      {result.errors.length > 5 && <p>...y {result.errors.length - 5} más</p>}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-emerald-600">
                    <CheckCircle className="h-4 w-4" />
                    Importación completada
                  </div>
                </div>
              )}

              {/* Template download */}
              <div className="flex items-center justify-between pt-1">
                <a
                  href="data:text/csv;charset=utf-8,%EF%BB%BFNombre,Email,Tel%C3%A9fono,Notas%0AJuan%20P%C3%A9rez,juan@ejemplo.com,%2B54%2011%201234-5678,Cliente%20frecuente"
                  download="plantilla-clientes.csv"
                  className="text-xs transition-colors"
                  style={{ color: "#2563eb" }}
                >
                  Descargar plantilla
                </a>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-medium transition-all"
                  style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-muted)" }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
