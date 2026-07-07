"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Loader2, CheckCircle, ToggleLeft, ToggleRight } from "lucide-react";

const COLORS = [
  "#2563eb","#3b82f6","#0ea5e9","#06b6d4","#10b981",
  "#f59e0b","#ef4444","#ec4899","#8b5cf6","#64748b",
];

type Props = {
  staffId: string;
  initial: {
    name: string; title: string; bio: string;
    phone: string; accentColor: string; isActive: boolean;
  };
};

export function StaffProfileForm({ staffId, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [ok,     setOk]     = useState(false);

  function set(k: keyof typeof form, v: string | boolean) {
    setForm(f => ({ ...f, [k]: v }));
    setOk(false);
  }

  async function save() {
    setSaving(true);
    await fetch(`/api/staff/${staffId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setOk(true);
    router.refresh();
  }

  return (
    <div className="space-y-5 rounded-2xl p-5" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Nombre completo *</Label>
          <Input value={form.name} onChange={e => set("name", e.target.value)} className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Título</Label>
          <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Lic., Dr., Dra., Mg..." className="h-10" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Bio / Especialidad</Label>
        <Input value={form.bio} onChange={e => set("bio", e.target.value)} placeholder="Psicóloga clínica, orientación cognitivo-conductual" className="h-10" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Teléfono</Label>
        <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+54 11 1234-5678" className="h-10" />
      </div>

      {/* Color */}
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Color identificador</Label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => set("accentColor", c)}
              className="h-8 w-8 rounded-xl transition-all"
              style={{
                backgroundColor: c,
                boxShadow: form.accentColor === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : undefined,
                transform: form.accentColor === c ? "scale(1.15)" : undefined,
              }}
            />
          ))}
        </div>
      </div>

      {/* Active toggle */}
      <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: "var(--bg-subtle)" }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Estado del profesional</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {form.isActive ? "Visible en la página de reservas" : "Oculto para los pacientes"}
          </p>
        </div>
        <button onClick={() => set("isActive", !form.isActive)} type="button">
          {form.isActive
            ? <ToggleRight className="h-8 w-8" style={{ color: "#2563eb" }} />
            : <ToggleLeft  className="h-8 w-8" style={{ color: "var(--text-faint)" }} />
          }
        </button>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-60"
          style={{ backgroundColor: "#2563eb" }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar cambios
        </button>
        {ok && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-500">
            <CheckCircle className="h-4 w-4" /> Guardado
          </span>
        )}
      </div>
    </div>
  );
}
