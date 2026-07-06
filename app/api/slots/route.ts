import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateTimeSlots } from "@/lib/utils";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import { getClientIp } from "@/lib/rate-limit";
import { checkSlotsRateLimit } from "@/lib/abuse";

// Converts a UTC Date to the local time in the given IANA timezone
// using built-in Intl — no extra packages needed.
function toZonedTime(date: Date, tz: string): Date {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((p) => [p.type, p.value]));
  return new Date(`${parts.year}-${parts.month}-${parts.day}T${parts.hour === "24" ? "00" : parts.hour}:${parts.minute}:${parts.second}`);
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const slotLimit = checkSlotsRateLimit(ip);
  if (!slotLimit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");
  const serviceId = searchParams.get("serviceId");
  const staffId   = searchParams.get("staffId"); // optional — for clinic staff
  const dateStr   = searchParams.get("date");

  if (!tenantId || !serviceId || !dateStr) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const date = parseISO(dateStr);
  const dayOfWeek = date.getDay();

  // Staff availability overrides tenant availability when staffId is present
  const [availability, service, existingAppointments, tenantData] = await Promise.all([
    staffId
      ? prisma.staffAvailability.findUnique({ where: { staffId_dayOfWeek: { staffId, dayOfWeek } } })
      : prisma.availability.findUnique({ where: { tenantId_dayOfWeek: { tenantId, dayOfWeek } } }),
    prisma.service.findUnique({ where: { id: serviceId } }),
    prisma.appointment.findMany({
      where: {
        tenantId,
        ...(staffId ? { staffId } : {}),
        startTime: { gte: startOfDay(date), lte: endOfDay(date) },
        status: { notIn: ["CANCELLED"] },
      },
      select: { startTime: true, endTime: true },
    }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { timezone: true } }),
  ]);

  if (!availability?.isActive || !service) {
    return NextResponse.json({ slots: [] });
  }

  const tz = tenantData?.timezone ?? "UTC";
  const zonedDate = toZonedTime(date, tz);
  const allSlots = generateTimeSlots(availability.startTime, availability.endTime, service.duration, zonedDate);

  const bookedTimes = new Set(existingAppointments.map((a) => format(a.startTime, "HH:mm")));

  const now = toZonedTime(new Date(), tz);
  const available = allSlots
    .filter((slot) => slot > now)
    .filter((slot) => !bookedTimes.has(format(slot, "HH:mm")))
    .map((slot) => format(slot, "HH:mm"));

  return NextResponse.json({ slots: available });
}
