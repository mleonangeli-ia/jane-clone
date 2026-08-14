"use client";

import { useState } from "react";
import { format, addDays, startOfDay, isBefore, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays, Loader2, CheckCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  appointmentId: string;
  tenantId: string;
  serviceId: string;
  staffId?: string | null;
  onClose: () => void;
};

export function AppointmentRescheduleModal({ appointmentId, tenantId, serviceId, staffId, onClose }: Props) {
  const router = useRouter();
  const today = startOfDay(new Date());

  const [weekStart, setWeekStart]     = useState(today);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots]             = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [done, setDone]               = useState(false);
  const [error, setError]             = useState("");

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const canGoPrev = weekStart > today;

  async function selectDate(date: Date) {
    setSelectedDate(date);
    setSelectedTime(null);
    setSlots([]);
    setLoadingSlots(true);
    setError("");
    const params = new URLSearchParams({
      tenantId,
      serviceId,
      date: format(date, "yyyy-MM-dd"),
    });
    if (staffId) params.set("staffId", staffId);
    const res  = await fetch(`/api/slots?${params}`);
    const data = await res.json();
    setSlots(data.slots ?? []);
    setLoadingSlots(false);
  }

  async function confirm() {
    if (!selectedDate || !selectedTime) return;
    setSaving(true);
    setError("");

    const newStart = new Date(selectedDate);
    const [h, m] = selectedTime.split(":").map(Number);
    newStart.setHours(h, m, 0, 0);

    const res = await fetch(`/api/appointments/${appointmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startTime: newStart.toISOString() }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Error al reagendar. Intentá de nuevo.");
      setSaving(false);
      return;
    }

    setDone(true);
    setTimeout(() => {
      router.refresh();
      onClose();
    }, 1500);
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl shadow-2xl"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>Reagendar turno</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {done ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-7 w-7 text-emerald-500" />
              </div>
              <p className="font-semibold" style={{ color: "var(--text)" }}>¡Turno reagendado!</p>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                Se envió un email de confirmación al paciente.
              </p>
            </div>
          ) : (
            <>
              {/* Weekly calendar */}
              <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--border)" }}>
                {/* Nav */}
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                  <button
                    onClick={() => setWeekStart((w) => addDays(w, -7))}
                    disabled={!canGoPrev}
                    className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors disabled:opacity-30"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-semibold capitalize" style={{ color: "var(--text)" }}>
                    {format(weekStart, "MMMM yyyy", { locale: es })}
                  </span>
                  <button
                    onClick={() => setWeekStart((w) => addDays(w, 7))}
                    className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Day labels */}
                <div className="grid grid-cols-7 px-3 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"].map((d) => (
                    <div key={d} className="text-center text-[11px] font-medium" style={{ color: "var(--text-faint)" }}>
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-1 p-3">
                  {days.map((day) => {
                    const isPast     = isBefore(day, today);
                    const isSelected = selectedDate?.toDateString() === day.toDateString();
                    const isTodayDay = isToday(day);
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => !isPast && selectDate(day)}
                        disabled={isPast}
                        className="relative flex flex-col items-center rounded-xl py-2 text-xs transition-all"
                        style={{
                          backgroundColor: isSelected ? "#0f766e" : "transparent",
                          color: isSelected ? "white" : isPast ? "var(--text-faint)" : "var(--text)",
                          cursor: isPast ? "not-allowed" : "pointer",
                          opacity: isPast ? 0.4 : 1,
                        }}
                      >
                        <span>{format(day, "d")}</span>
                        {isTodayDay && !isSelected && (
                          <span className="mt-0.5 h-1 w-1 rounded-full bg-teal-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots */}
              {selectedDate && (
                <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                    <CalendarDays className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                    <span className="text-sm font-medium capitalize" style={{ color: "var(--text)" }}>
                      {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                    </span>
                  </div>
                  <div className="p-4">
                    {loadingSlots ? (
                      <div className="grid grid-cols-4 gap-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div key={i} className="h-10 rounded-xl skeleton" />
                        ))}
                      </div>
                    ) : slots.length === 0 ? (
                      <p className="py-4 text-center text-sm" style={{ color: "var(--text-faint)" }}>
                        Sin horarios disponibles
                      </p>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {slots.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => setSelectedTime(slot)}
                            className="rounded-xl border py-2.5 text-sm font-medium transition-all"
                            style={{
                              backgroundColor: selectedTime === slot ? "#0f766e" : "transparent",
                              color: selectedTime === slot ? "white" : "var(--text)",
                              borderColor: selectedTime === slot ? "#0f766e" : "var(--border)",
                            }}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </p>
              )}

              {/* Confirm button */}
              <button
                onClick={confirm}
                disabled={!selectedTime || saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-40"
                style={{ backgroundColor: "#0f766e" }}
              >
                {saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Reagendando...</>
                ) : (
                  `Confirmar${selectedTime ? ` · ${selectedTime}` : ""}`
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
