"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

type DayData = { id?: string; startTime: string; endTime: string; isActive: boolean };

export function AvailabilityForm({ initialData }: { initialData: Record<number, DayData> }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [days, setDays] = useState<Record<number, DayData>>(() => {
    const result: Record<number, DayData> = {};
    for (let i = 0; i < 7; i++) {
      result[i] = initialData[i] ?? { startTime: "09:00", endTime: "18:00", isActive: false };
    }
    return result;
  });

  function toggle(day: number) {
    setDays((prev) => ({ ...prev, [day]: { ...prev[day], isActive: !prev[day].isActive } }));
  }

  function updateTime(day: number, field: "startTime" | "endTime", value: string) {
    setDays((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }

  async function save() {
    setSaving(true);
    await fetch("/api/availability", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {DAYS.map((name, i) => {
        const day = days[i];
        return (
          <Card key={i} className={day.isActive ? "border-indigo-200" : ""}>
            <CardContent className="flex items-center gap-4 py-4">
              <label className="flex items-center gap-3 w-28 cursor-pointer">
                <input
                  type="checkbox"
                  checked={day.isActive}
                  onChange={() => toggle(i)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className={`text-sm font-medium ${day.isActive ? "text-gray-900" : "text-gray-400"}`}>
                  {name}
                </span>
              </label>
              <div className={`flex items-center gap-3 ${!day.isActive && "opacity-40 pointer-events-none"}`}>
                <Input
                  type="time"
                  value={day.startTime}
                  onChange={(e) => updateTime(i, "startTime", e.target.value)}
                  className="w-32"
                />
                <span className="text-gray-400">–</span>
                <Input
                  type="time"
                  value={day.endTime}
                  onChange={(e) => updateTime(i, "endTime", e.target.value)}
                  className="w-32"
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? "Guardando..." : "Guardar disponibilidad"}
        </Button>
      </div>
    </div>
  );
}
