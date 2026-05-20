"use client";

import { useState } from "react";
import { format, addDays, startOfDay, isBefore, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingForm } from "./BookingForm";
import { WaitlistSection } from "./WaitlistSection";

type AvailabilitySlot = { dayOfWeek: number; startTime: string; endTime: string };
type Props = {
  tenantId: string;
  tenantSlug: string;
  service: { id: string; name: string; duration: number; price: number };
  availability: AvailabilitySlot[];
  accentColor: string;
};

const DAY_LABELS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

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
    const res = await fetch(`/api/slots?tenantId=${tenantId}&serviceId=${service.id}&date=${format(date, "yyyy-MM-dd")}`);
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

  const canGoPrev = !isBefore(addDays(weekStart, -1), today);

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {/* Month nav */}
        <div className="flex items-center justify-between border-b border-gray-50 px-5 py-3.5">
          <button
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            disabled={!canGoPrev}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold capitalize text-gray-700">
            {format(weekStart, "MMMM yyyy", { locale: es })}
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
          {DAY_LABELS.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400">{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1 p-4">
          {days.map((day) => {
            const isAvailable = availableDays.has(day.getDay()) && !isBefore(day, today);
            const isSelected = selectedDate?.toDateString() === day.toDateString();
            const isTodayDate = isToday(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => isAvailable && selectDate(day)}
                disabled={!isAvailable}
                className={`
                  relative flex flex-col items-center rounded-xl py-2.5 text-xs transition-all
                  ${isSelected ? "text-white font-bold shadow-md" : ""}
                  ${!isSelected && isAvailable ? "hover:bg-gray-50 text-gray-700 cursor-pointer" : ""}
                  ${!isAvailable ? "text-gray-300 cursor-not-allowed" : ""}
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

      {/* Time slots */}
      {selectedDate && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-50 px-5 py-3.5">
            <CalendarDays className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-semibold capitalize text-gray-700">
              {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
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
              <WaitlistSection
                tenantId={tenantId}
                serviceId={service.id}
                date={format(selectedDate, "yyyy-MM-dd")}
                accentColor={accentColor}
              />
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((slot) => {
                  const isSelected = selectedTime === slot;
                  return (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`rounded-xl border py-2.5 text-sm font-medium transition-all ${
                        isSelected
                          ? "text-white border-transparent shadow-md scale-105"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                      style={isSelected ? { backgroundColor: accentColor } : undefined}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CTA */}
      {selectedTime && (
        <button
          onClick={() => setStep("form")}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
          style={{ backgroundColor: accentColor }}
        >
          Continuar → {selectedTime}
        </button>
      )}
    </div>
  );
}
