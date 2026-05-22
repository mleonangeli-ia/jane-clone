import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateTimeSlots } from "@/lib/utils";
import { format } from "date-fns";

// Use local-time constructor to avoid timezone issues in slot generation
const TUESDAY = new Date(2026, 5, 9); // June 9, 2026 midnight local time

function getAvailableSlots(
  startTime: string,
  endTime: string,
  duration: number,
  date: Date,
  bookedTimes: string[] = [],
  now: Date = new Date(2026, 5, 9, 8, 0, 0) // June 9 8 AM local time
): string[] {
  const allSlots = generateTimeSlots(startTime, endTime, duration, date);
  const booked = new Set(bookedTimes);
  return allSlots
    .filter((slot) => slot > now)
    .filter((slot) => !booked.has(format(slot, "HH:mm")))
    .map((slot) => format(slot, "HH:mm"));
}

describe("slot availability algorithm", () => {
  it("returns all slots when nothing is booked", () => {
    const slots = getAvailableSlots("10:00", "13:00", 60, TUESDAY);
    assert.deepStrictEqual(slots, ["10:00", "11:00", "12:00"]);
  });

  it("excludes booked slots", () => {
    const slots = getAvailableSlots("10:00", "13:00", 60, TUESDAY, ["11:00"]);
    assert.deepStrictEqual(slots, ["10:00", "12:00"]);
  });

  it("excludes slots in the past", () => {
    const now = new Date(2026, 5, 9, 10, 30, 0); // 10:30 local
    const slots = getAvailableSlots("10:00", "13:00", 60, TUESDAY, [], now);
    assert.deepStrictEqual(slots, ["11:00", "12:00"]);
  });

  it("returns empty when all slots are booked", () => {
    const slots = getAvailableSlots("10:00", "12:00", 60, TUESDAY, ["10:00", "11:00"]);
    assert.strictEqual(slots.length, 0);
  });

  it("returns empty for a past date", () => {
    const pastDate = new Date(2026, 0, 1); // Jan 1 local
    const futureNow = new Date(2026, 5, 9, 8, 0, 0); // June 9 8 AM local
    const slots = getAvailableSlots("10:00", "19:00", 60, pastDate, [], futureNow);
    assert.strictEqual(slots.length, 0);
  });

  it("handles 30-min slots with some booked", () => {
    const slots = getAvailableSlots("09:00", "11:00", 30, TUESDAY, ["09:30", "10:30"]);
    assert.deepStrictEqual(slots, ["09:00", "10:00"]);
  });

  it("handles 90-min slots correctly", () => {
    const slots = getAvailableSlots("09:00", "13:30", 90, TUESDAY);
    assert.deepStrictEqual(slots, ["09:00", "10:30", "12:00"]);
  });
});
