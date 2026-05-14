"use client";

import { useState } from "react";
import { format, addDays, startOfDay, isBefore, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingForm } from "./BookingForm";

type AvailabilitySlot = { dayOfWeek: number; startTime: string; endTime: string };

type Props = {
  tenantId: string;
  tenantSlug: string;
  service: { id: string; name: string; duration: number; price: number };
  availability: AvailabilitySlot[];
  accentColor: string;
};

export function BookingCalendar({ tenantId, tenantSlug, service, availability, accentColor }: Props) {
  const today = startOfDay(new Date());
  const [weekStart, setWeekStart] = useState(today);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [step, setStep] = useState<"calendar" | "form">("calendar");

  const availableDays = new Set(availability.map((a) => a.dayOfWeek));
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

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

  if (step === "form" && selectedDate && selectedTime) {
    return (
      <BookingForm
        tenantId={tenantId}
        service={service}
        date={selectedDate}
        time={selectedTime}
        accentColor={accentColor}
        onBack={() => setStep("calendar")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            disabled={isBefore(addDays(weekStart, -1), today)}
            className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-gray-700">
            {format(weekStart, "MMMM yyyy", { locale: es })}
          </span>
          <button
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const isAvailable = availableDays.has(day.getDay()) && !isBefore(day, today);
            const isSelected = selectedDate?.toDateString() === day.toDateString();
            return (
              <button
                key={day.toISOString()}
                onClick={() => isAvailable && selectDate(day)}
                disabled={!isAvailable}
                className={`flex flex-col items-center rounded-lg py-2 text-xs transition-colors ${
                  isSelected
                    ? "text-white font-bold"
                    : isAvailable
                    ? "hover:bg-gray-100 text-gray-700"
                    : "text-gray-300 cursor-not-allowed"
                }`}
                style={isSelected ? { backgroundColor: accentColor } : undefined}
              >
                <span>{format(day, "EEE", { locale: es })}</span>
                <span className={`mt-1 text-sm font-medium ${isToday(day) && !isSelected ? "text-indigo-600" : ""}`}>
                  {format(day, "d")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-medium text-gray-600">
            {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
          </h3>
          {loadingSlots ? (
            <p className="text-center text-sm text-gray-400 py-4">Cargando horarios...</p>
          ) : slots.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-4">No hay horarios disponibles para este día.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedTime(slot)}
                  className={`rounded-lg border py-2 text-sm font-medium transition-colors ${
                    selectedTime === slot
                      ? "text-white border-transparent"
                      : "border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
                  style={selectedTime === slot ? { backgroundColor: accentColor, borderColor: accentColor } : undefined}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedTime && (
        <Button className="w-full" onClick={() => setStep("form")} style={{ backgroundColor: accentColor }}>
          Continuar con {selectedTime}
        </Button>
      )}
    </div>
  );
}
