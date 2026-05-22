import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { addMinutes, parseISO } from "date-fns";

type TimeRange = { startTime: Date; endTime: Date };

function hasConflict(existing: TimeRange[], newStart: Date, newEnd: Date): boolean {
  return existing.some(
    ({ startTime, endTime }) =>
      (newStart >= startTime && newStart < endTime) ||
      (newEnd > startTime && newEnd <= endTime) ||
      (newStart <= startTime && newEnd >= endTime)
  );
}

describe("appointment conflict detection", () => {
  const start = parseISO("2026-06-10T10:00:00Z");
  const end = addMinutes(start, 60);

  it("detects an exact overlap", () => {
    assert.strictEqual(hasConflict([{ startTime: start, endTime: end }], start, end), true);
  });

  it("detects overlap when new appointment starts during existing", () => {
    const newStart = parseISO("2026-06-10T10:30:00Z");
    const newEnd = addMinutes(newStart, 60);
    assert.strictEqual(hasConflict([{ startTime: start, endTime: end }], newStart, newEnd), true);
  });

  it("detects overlap when new appointment ends during existing", () => {
    const newStart = parseISO("2026-06-10T09:30:00Z");
    const newEnd = parseISO("2026-06-10T10:30:00Z");
    assert.strictEqual(hasConflict([{ startTime: start, endTime: end }], newStart, newEnd), true);
  });

  it("detects containment — new wraps the existing", () => {
    const newStart = parseISO("2026-06-10T09:00:00Z");
    const newEnd = parseISO("2026-06-10T12:00:00Z");
    assert.strictEqual(hasConflict([{ startTime: start, endTime: end }], newStart, newEnd), true);
  });

  it("allows back-to-back appointments", () => {
    const newStart = end;
    const newEnd = addMinutes(newStart, 60);
    assert.strictEqual(hasConflict([{ startTime: start, endTime: end }], newStart, newEnd), false);
  });

  it("allows an appointment entirely before existing", () => {
    const newStart = parseISO("2026-06-10T08:00:00Z");
    const newEnd = parseISO("2026-06-10T09:00:00Z");
    assert.strictEqual(hasConflict([{ startTime: start, endTime: end }], newStart, newEnd), false);
  });

  it("allows an appointment on a different day", () => {
    const newStart = parseISO("2026-06-11T10:00:00Z");
    const newEnd = addMinutes(newStart, 60);
    assert.strictEqual(hasConflict([{ startTime: start, endTime: end }], newStart, newEnd), false);
  });

  it("handles an empty existing list", () => {
    assert.strictEqual(hasConflict([], start, end), false);
  });
});
