"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";

const COLORS = [
  "#10b981", "#0ea5e9", "#a78bfa", "#f59e0b",
  "#ef4444", "#ec4899", "#6366f1", "#14b8a6",
];

export function StaffForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(e.currentTarget);

    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:        data.get("name"),
        title:       data.get("title") || undefined,
        bio:         data.get("bio") || undefined,
        phone:       data.get("phone") || undefined,
        accentColor: color,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const json = await res.json();
      setError(json.error || "Error al agregar el profesional");
      return;
    }

    (e.target as HTMLFormElement).reset();
    setColor(COLORS[0]);
    router.refresh();
  }

  return (
    <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
              Nombre completo *
            </Label>
            <Input id="name" name="name" required placeholder="Florencia Lucchini" className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
              Título
            </Label>
            <Input id="title" name="title" placeholder="Lic., Dr., Dra., Mg..." className="h-10" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio" className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
            Bio / Especialidad
          </Label>
          <Input id="bio" name="bio" placeholder="Psicóloga clínica, orientación cognitivo-conductual" className="h-10" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
            Color identificador
          </Label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="h-8 w-8 rounded-xl transition-all"
                style={{
                  backgroundColor: c,
                  boxShadow: color === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : undefined,
                  transform: color === c ? "scale(1.15)" : undefined,
                }}
              />
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-60"
          style={{ backgroundColor: color }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Agregar profesional
        </button>
      </form>
    </div>
  );
}
