"use client";

import { useState } from "react";
import { format, addDays, startOfDay, isBefore, isToday } from "date-fns";
import type { Locale as DateFnsLocale } from "date-fns";
import { es, enUS, ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays, CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";

const DATE_FNS: Record<Locale, DateFnsLocale> = { es, en: enUS, pt: ptBR };
const DAY_LABELS: Record<Locale, string[]> = {
  es: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"],
  en: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  pt: ["Do", "Se", "Te", "Qu", "Qu", "Se", "Sá"],
};

type AvailabilitySlot = { dayOfWeek: number; startTime: string; endTime: string };

type Props = {
  appointmentId: string;
  token: string;
  tenantId: string;
  tenantSlug: string;
  service: { id: string; name: string; duration: number; price: number };
  availability: AvailabilitySlot[];
  accentColor: string;
  locale?: Locale;
};

export function RescheduleCalendar({
  appointmentId, token, tenantId, tenantSlug, service, availability, accentColor, locale = "es",
}: Props) {
  const dateFnsLocale = DATE_FNS[locale];
  const dayLabels = DAY_LABELS[locale];
  const router = useRouter();

  const today = startOfDay(new Date());
  const [weekStart, setWeekStart] = useState(today);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const availableDays = new Set(availability.map((a) => a.dayOfWeek));
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const canGoPrev = !isBefore(addDays(weekStart, -1), today);

  async function selectDate(date: Date) {
    setSelectedDate(date);
    setSelectedTime(null);
    setLoadingSlots(true);
    const res = await fetch(
      `/api/slots?tenantId=${tenantId}&serviceId=${service.id}&date=${format(date, "yyyy-MM-dd")}`
    );
    const data = await res.json();
    setSlots(data.slots ?? []);
    setLoadingSlots(false);
  }

  async function confirm() {
    if (!selectedDate || !selectedTime) return;
    setConfirming(true);
    setError("");

    const newStart = new Date(selectedDate);
    const [h, m] = selectedTime.split(":").map(Number);
    newStart.setHours(h, m, 0, 0);

    const res = await fetch("/api/appointments/reschedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId, token, newStartTime: newStart.toISOString() }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Error al reagendar. Intentá de nuevo.");
      setConfirming(false);
      return;
    }

    setDone(true);
    setTimeout(() => router.push(`/book/${tenantSlug}`), 3500);
  }

  // ── Done ─────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="flex flex-col items-center py-10 text-center animate-fade-up">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">¡Turno reagendado!</h2>
        <p className="mt-2 text-sm text-gray-500">
          Tu nuevo turno fue confirmado.
          <br />Te enviamos un email con los detalles.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-50 px-5 py-3.5">
          <button
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            disabled={!canGoPrev}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold capitalize text-gray-700">
            {format(weekStart, "MMMM yyyy", { locale: dateFnsLocale })}
          </span>
          <button
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 border-b border-gray-50 px-4 py-2">
          {dayLabels.map((d, i) => (
            <div key={i} className="text-center text-xs font-medium text-gray-400">{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1 p-4">
          {days.map((day) => {
            const isAvail   = availableDays.has(day.getDay()) && !isBefore(day, today);
            const isSelected = selectedDate?.toDateString() === day.toDateString();
            const isTodayDate = isToday(day);
            return (
              <button
                key={day.toISOString()}
                onClick={() => isAvail && selectDate(day)}
                disabled={!isAvail}
                className={`relative flex flex-col items-center rounded-xl py-2.5 text-xs transition-all
                  ${isSelected ? "font-bold text-white shadow-md" : ""}
                  ${!isSelected && isAvail ? "hover:bg-gray-50 text-gray-700 cursor-pointer" : ""}
                  ${!isAvail ? "text-gray-300 cursor-not-allowed" : ""}
                `}
                style={isSelected ? { backgroundColor: accentColor } : undefined}
              >
                <span className="leading-none">{format(day, "d")}</span>
                {isTodayDate && !isSelected && (
                  <span className="mt-1 h-1 w-1 rounded-full" style={{ backgroundColor: accentColor }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Slots */}
      {selectedDate && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-50 px-5 py-3.5">
            <CalendarDays className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-semibold capitalize text-gray-700">
              {format(selectedDate, "EEEE d 'de' MMMM", { locale: dateFnsLocale })}
            </span>
          </div>
          <div className="p-4">
            {loadingSlots ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-10 rounded-xl skeleton" />
                ))}
              </div>
            ) : slots.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">
                Sin horarios disponibles para este día
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className={`rounded-xl border py-2.5 text-sm font-medium transition-all ${
                      selectedTime === slot
                        ? "text-white border-transparent shadow-md scale-105"
                        : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    style={selectedTime === slot ? { backgroundColor: accentColor } : undefined}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Confirm */}
      {selectedTime && (
        <button
          onClick={confirm}
          disabled={confirming}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-60"
          style={{ backgroundColor: accentColor }}
        >
          {confirming ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Reagendando...</>
          ) : (
            <>Confirmar nuevo horario · {selectedTime}</>
          )}
        </button>
      )}
    </div>
  );
}
