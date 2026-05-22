import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, addMinutes } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(cents: number, currency = "ARS") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function formatDateTime(date: Date) {
  return format(date, "EEEE d 'de' MMMM, HH:mm", { locale: es });
}

export function getEndTime(start: Date, durationMinutes: number) {
  return addMinutes(start, durationMinutes);
}

export function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number,
  date: Date
): Date[] {
  const slots: Date[] = [];
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  const base = new Date(date);
  base.setHours(startH, startM, 0, 0);

  const end = new Date(date);
  end.setHours(endH, endM, 0, 0);

  let current = base;
  while (addMinutes(current, durationMinutes) <= end) {
    slots.push(new Date(current));
    current = addMinutes(current, durationMinutes);
  }

  return slots;
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
