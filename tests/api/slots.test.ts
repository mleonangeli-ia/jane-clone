import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateTimeSlots } from "@/lib/utils";
import { format } from "date-fns";

// Tests for the slot-availability logic that lives inside /api/slots
// We test the core algorithm (generateTimeSlots + filtering) directly.

const TUESDAY = new Date("2026-06-09T00:00:00.000Z"); // a fixed Tuesday

function getAvailableSlots(
  startTime: string,
  endTime: string,
  duration: number,
  date: Date,
  bookedTimes: string[] = [],
  now: Date = new Date("2026-06-09T08:00:00.000Z")
): string[] {
  const allSlots = generateTimeSlots(startTime, endTime, duration, date);
  const booked = new Set(bookedTimes);
  return allSlots
    .filter((slot) => slot > now)
    .filter((slot) => !booked.has(format(slot, "HH:mm")))
    .map((slot) => format(slot, "HH:mm"));
}

describe("slot availability algorithm", () => {
  it("returns all slots when nothing is booked and time is before start", () => {
    const slots = getAvailableSlots("10:00", "13:00", 60, TUESDAY, [], new Date("2026-06-09T08:00:00Z"));
    expect(slots).toEqual(["10:00", "11:00", "12:00"]);
  });

  it("excludes booked slots", () => {
    const slots = getAvailableSlots("10:00", "13:00", 60, TUESDAY, ["11:00"], new Date("2026-06-09T08:00:00Z"));
    expect(slots).toEqual(["10:00", "12:00"]);
  });

  it("excludes slots in the past relative to now", () => {
    // now = 10:30, so 10:00 should be excluded
    const now = new Date("2026-06-09T10:30:00.000Z");
    const slots = getAvailableSlots("10:00", "13:00", 60, TUESDAY, [], now);
    expect(slots).toEqual(["11:00", "12:00"]);
  });

  it("returns empty when all slots are booked", () => {
    const slots = getAvailableSlots("10:00", "12:00", 60, TUESDAY, ["10:00", "11:00"], new Date("2026-06-09T08:00:00Z"));
    expect(slots).toHaveLength(0);
  });

  it("returns empty for a past date", () => {
    const pastDate = new Date("2026-01-01T00:00:00.000Z");
    const futureNow = new Date("2026-06-09T08:00:00.000Z");
    const slots = getAvailableSlots("10:00", "19:00", 60, pastDate, [], futureNow);
    expect(slots).toHaveLength(0);
  });

  it("handles 30-min slots with some booked", () => {
    const slots = getAvailableSlots("09:00", "11:00", 30, TUESDAY, ["09:30", "10:30"], new Date("2026-06-09T08:00:00Z"));
    expect(slots).toEqual(["09:00", "10:00"]);
  });

  it("handles 90-min slots", () => {
    const slots = getAvailableSlots("09:00", "13:30", 90, TUESDAY, [], new Date("2026-06-09T08:00:00Z"));
    // 09:00 + 90m = 10:30, 10:30 + 90m = 12:00, 12:00 + 90m = 13:30 (equal to end → not included)
    expect(slots).toEqual(["09:00", "10:30", "12:00"]);
  });
});
