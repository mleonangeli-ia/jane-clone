import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateTimeSlots } from "@/lib/utils";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");
  const serviceId = searchParams.get("serviceId");
  const dateStr = searchParams.get("date");

  if (!tenantId || !serviceId || !dateStr) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const date = parseISO(dateStr);
  const dayOfWeek = date.getDay();

  const [availability, service, existingAppointments] = await Promise.all([
    prisma.availability.findUnique({
      where: { tenantId_dayOfWeek: { tenantId, dayOfWeek } },
    }),
    prisma.service.findUnique({ where: { id: serviceId } }),
    prisma.appointment.findMany({
      where: {
        tenantId,
        startTime: { gte: startOfDay(date), lte: endOfDay(date) },
        status: { notIn: ["CANCELLED"] },
      },
      select: { startTime: true, endTime: true },
    }),
  ]);

  if (!availability?.isActive || !service) {
    return NextResponse.json({ slots: [] });
  }

  const allSlots = generateTimeSlots(availability.startTime, availability.endTime, service.duration, date);

  const bookedTimes = new Set(existingAppointments.map((a) => format(a.startTime, "HH:mm")));

  const now = new Date();
  const available = allSlots
    .filter((slot) => slot > now)
    .filter((slot) => !bookedTimes.has(format(slot, "HH:mm")))
    .map((slot) => format(slot, "HH:mm"));

  return NextResponse.json({ slots: available });
}
