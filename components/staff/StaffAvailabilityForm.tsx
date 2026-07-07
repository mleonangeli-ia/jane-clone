"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Save, Loader2, CheckCircle } from "lucide-react";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

type DayData = { startTime: string; endTime: string; isActive: boolean };

export function StaffAvailabilityForm({
  staffId,
  initialData,
}: {
  staffId: string;
  initialData: Record<number, DayData>;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [ok,     setOk]     = useState(false);

  const [days, setDays] = useState<Record<number, DayData>>(() => {
    const r: Record<number, DayData> = {};
    for (let i = 0; i < 7; i++) {
      r[i] = initialData[i] ?? { startTime: "09:00", endTime: "18:00", isActive: false };
    }
    return r;
  });

  function toggle(i: number) {
    setDays(prev => ({ ...prev, [i]: { ...prev[i], isActive: !prev[i].isActive } }));
    setOk(false);
  }

  function setTime(i: number, field: "startTime" | "endTime", val: string) {
    setDays(prev => ({ ...prev, [i]: { ...prev[i], [field]: val } }));
    setOk(false);
  }

  async function save() {
    setSaving(true);
    await fetch(`/api/staff/${staffId}/availability`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days }),
    });
    setSaving(false);
    setOk(true);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}>
        {DAYS.map((name, i) => {
          const d = days[i];
          return (
            <div
              key={i}
              className="flex items-center gap-4 px-5 py-3.5"
              style={{
                borderBottom: i < 6 ? "1px solid var(--border-subtle)" : "none",
                opacity: d.isActive ? 1 : 0.5,
              }}
            >
              {/* Toggle */}
              <label className="flex w-28 cursor-pointer items-center gap-3 shrink-0">
                <input
                  type="checkbox"
                  checked={d.isActive}
                  onChange={() => toggle(i)}
                  className="h-4 w-4 rounded accent-blue-600"
                />
                <span className="text-sm font-medium" style={{ color: d.isActive ? "var(--text)" : "var(--text-faint)" }}>
                  {name}
                </span>
              </label>

              {/* Times */}
              <div className="flex flex-1 items-center gap-2 text-sm">
                <Input
                  type="time"
                  value={d.startTime}
                  onChange={e => setTime(i, "startTime", e.target.value)}
                  disabled={!d.isActive}
                  className="h-9 w-28 text-xs"
                />
                <span style={{ color: "var(--text-faint)" }}>→</span>
                <Input
                  type="time"
                  value={d.endTime}
                  onChange={e => setTime(i, "endTime", e.target.value)}
                  disabled={!d.isActive}
                  className="h-9 w-28 text-xs"
                />
                {d.isActive && (
                  <span className="hidden text-xs sm:block" style={{ color: "var(--text-faint)" }}>
                    {(() => {
                      const [sh, sm] = d.startTime.split(":").map(Number);
                      const [eh, em] = d.endTime.split(":").map(Number);
                      const mins = (eh * 60 + em) - (sh * 60 + sm);
                      if (mins <= 0) return "";
                      return `${Math.floor(mins / 60)}h${mins % 60 > 0 ? ` ${mins % 60}m` : ""}`;
                    })()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-60"
          style={{ backgroundColor: "#2563eb" }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar disponibilidad
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
