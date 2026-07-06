"use client";

import { useState } from "react";
import { format, addDays, startOfDay, isBefore, isToday } from "date-fns";
import { es, enUS, ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays, Clock } from "lucide-react";
import { BookingForm } from "./BookingForm";
import { WaitlistSection } from "./WaitlistSection";
import { getT, type Locale } from "@/lib/i18n";

import type { Locale as DateFnsLocale } from "date-fns";
const DATE_FNS_LOCALE: Record<Locale, DateFnsLocale> = { es, en: enUS, pt: ptBR };

type AvailabilitySlot = { dayOfWeek: number; startTime: string; endTime: string };
type Props = {
  tenantId: string;
  tenantSlug: string;
  service: { id: string; name: string; duration: number; price: number };
  availability: AvailabilitySlot[];
  accentColor: string;
  locale?: Locale;
  staffId?: string; // for clinic staff booking
};

export function BookingCalendar({ tenantId, tenantSlug, service, availability, accentColor, locale = "es", staffId }: Props) {
  const t = getT(locale);
  const dateFnsLocale = DATE_FNS_LOCALE[locale] ?? es;

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
    const staffParam = staffId ? `&staffId=${staffId}` : "";
    const res = await fetch(`/api/slots?tenantId=${tenantId}&serviceId=${service.id}&date=${format(date, "yyyy-MM-dd")}${staffParam}`);
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
        locale={locale}
        staffId={staffId}
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
          {t.calendar.days.map((d, i) => (
            <div key={i} className="text-center text-xs font-medium text-gray-400">{d}</div>
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
              <WaitlistSection
                tenantId={tenantId}
                serviceId={service.id}
                date={format(selectedDate, "yyyy-MM-dd")}
                accentColor={accentColor}
                locale={locale}
              />
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((slot) => {
                  const isSlotSelected = selectedTime === slot;
                  return (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`rounded-xl border py-2.5 text-sm font-medium transition-all ${
                        isSlotSelected
                          ? "text-white border-transparent shadow-md scale-105"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                      style={isSlotSelected ? { backgroundColor: accentColor } : undefined}
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
          {t.calendar.continue} → {selectedTime}
        </button>
      )}
    </div>
  );
}
