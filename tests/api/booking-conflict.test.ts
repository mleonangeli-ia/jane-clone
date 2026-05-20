import { describe, it, expect } from "vitest";
import { addMinutes, parseISO } from "date-fns";

// Reproduce the conflict-detection logic from /api/appointments POST
// without hitting the DB.

type TimeRange = { startTime: Date; endTime: Date };

function hasConflict(existing: TimeRange[], newStart: Date, newEnd: Date): boolean {
  return existing.some(
    ({ startTime, endTime }) =>
      // overlap check: same as the Prisma OR clause
      (newStart >= startTime && newStart < endTime) ||
      (newEnd > startTime && newEnd <= endTime) ||
      (newStart <= startTime && newEnd >= endTime)
  );
}

describe("appointment conflict detection", () => {
  const start = parseISO("2026-06-10T10:00:00Z");
  const end = addMinutes(start, 60); // 11:00

  it("detects exact overlap", () => {
    expect(hasConflict([{ startTime: start, endTime: end }], start, end)).toBe(true);
  });

  it("detects partial overlap — new appointment starts during existing", () => {
    const newStart = parseISO("2026-06-10T10:30:00Z");
    const newEnd = addMinutes(newStart, 60); // 11:30
    expect(hasConflict([{ startTime: start, endTime: end }], newStart, newEnd)).toBe(true);
  });

  it("detects partial overlap — new appointment ends during existing", () => {
    const newStart = parseISO("2026-06-10T09:30:00Z");
    const newEnd = parseISO("2026-06-10T10:30:00Z");
    expect(hasConflict([{ startTime: start, endTime: end }], newStart, newEnd)).toBe(true);
  });

  it("detects containment — new appointment wraps existing", () => {
    const newStart = parseISO("2026-06-10T09:00:00Z");
    const newEnd = parseISO("2026-06-10T12:00:00Z");
    expect(hasConflict([{ startTime: start, endTime: end }], newStart, newEnd)).toBe(true);
  });

  it("allows back-to-back appointments (no gap needed)", () => {
    // existing: 10:00–11:00, new: 11:00–12:00 → no conflict
    const newStart = end;
    const newEnd = addMinutes(newStart, 60);
    expect(hasConflict([{ startTime: start, endTime: end }], newStart, newEnd)).toBe(false);
  });

  it("allows appointment before existing", () => {
    const newStart = parseISO("2026-06-10T08:00:00Z");
    const newEnd = parseISO("2026-06-10T09:00:00Z");
    expect(hasConflict([{ startTime: start, endTime: end }], newStart, newEnd)).toBe(false);
  });

  it("allows appointment on a different day", () => {
    const newStart = parseISO("2026-06-11T10:00:00Z");
    const newEnd = addMinutes(newStart, 60);
    expect(hasConflict([{ startTime: start, endTime: end }], newStart, newEnd)).toBe(false);
  });

  it("handles empty existing list", () => {
    expect(hasConflict([], start, end)).toBe(false);
  });
});
