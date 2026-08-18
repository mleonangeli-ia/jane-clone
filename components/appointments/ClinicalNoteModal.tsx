"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2, ClipboardList, CheckCircle } from "lucide-react";

type Note = {
  subjective: string | null;
  objective:  string | null;
  assessment: string | null;
  plan:       string | null;
};

type Props = {
  appointmentId:  string;
  clientName:     string;
  serviceName:    string;
  appointmentDate: string;
  onClose:        () => void;
  onSaved?:       () => void;
};

const SOAP = [
  {
    key:         "subjective" as keyof Note,
    label:       "S — Subjetivo",
    description: "Lo que reporta el paciente: síntomas, quejas, motivo de consulta",
    placeholder: "El paciente refiere...",
    color:       "#0e7490",
    bg:          "#ecfeff",
  },
  {
    key:         "objective" as keyof Note,
    label:       "O — Objetivo",
    description: "Lo que observa el profesional: signos, mediciones, examen físico",
    placeholder: "Al examen: tensión arterial...",
    color:       "#0f766e",
    bg:          "#f0fdfa",
  },
  {
    key:         "assessment" as keyof Note,
    label:       "A — Análisis",
    description: "Diagnóstico o interpretación clínica",
    placeholder: "Diagnóstico presuntivo...",
    color:       "#7c3aed",
    bg:          "#faf5ff",
  },
  {
    key:         "plan" as keyof Note,
    label:       "P — Plan",
    description: "Tratamiento, indicaciones, próximos pasos",
    placeholder: "Se indica...",
    color:       "#b45309",
    bg:          "#fffbeb",
  },
] as const;

export function ClinicalNoteModal({ appointmentId, clientName, serviceName, appointmentDate, onClose, onSaved }: Props) {
  const [note, setNote]       = useState<Note>({ subjective: null, objective: null, assessment: null, plan: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    fetch(`/api/appointments/${appointmentId}/notes`)
      .then((r) => r.json())
      .then((data) => {
        if (data) setNote(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [appointmentId]);

  async function handleSave() {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/appointments/${appointmentId}/notes`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(note),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Error al guardar. Intentá de nuevo.");
      return;
    }
    setSaved(true);
    onSaved?.();
    setTimeout(() => setSaved(false), 2500);
  }

  const hasContent = Object.values(note).some((v) => v && v.trim());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl shadow-2xl"
        style={{
          backgroundColor: "var(--bg-card)",
          border:          "1px solid var(--border)",
          maxHeight:       "90vh",
        }}
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: "#f0fdfa" }}
            >
              <ClipboardList className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: "var(--text)" }}>
                Nota clínica — {clientName}
              </h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {serviceName} · {appointmentDate}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
            </div>
          ) : (
            SOAP.map(({ key, label, description, placeholder, color, bg }) => (
              <div key={key}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <label className="text-sm font-bold" style={{ color }}>
                    {label}
                  </label>
                  <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                    {description}
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={note[key] ?? ""}
                  onChange={(e) => setNote((n) => ({ ...n, [key]: e.target.value || null }))}
                  placeholder={placeholder}
                  className="w-full resize-none rounded-xl px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: bg,
                    border:          `1.5px solid ${color}30`,
                    color:           "var(--text)",
                    "--tw-ring-color": color,
                  } as React.CSSProperties}
                />
              </div>
            ))
          )}

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex shrink-0 items-center justify-between px-6 py-4"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>
            🔒 Privado — solo visible para el profesional
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium transition-all"
              style={{ color: "var(--text-muted)", backgroundColor: "var(--bg-subtle)" }}
            >
              Cerrar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasContent}
              className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ backgroundColor: saved ? "#059669" : "#0f766e" }}
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
              ) : saved ? (
                <><CheckCircle className="h-4 w-4" /> Guardado</>
              ) : (
                <><Save className="h-4 w-4" /> Guardar nota</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
