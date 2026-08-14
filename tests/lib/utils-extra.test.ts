import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatDateTime, getEndTime, cn } from "@/lib/utils";

describe("formatDateTime", () => {
  it("formats a date in Spanish long format", () => {
    const d = new Date("2026-08-15T14:30:00");
    const result = formatDateTime(d);
    // Should contain the time and be in Spanish
    assert.ok(result.includes("14:30"), `expected '14:30' in '${result}'`);
    assert.ok(result.toLowerCase().includes("agosto"), `expected 'agosto' in '${result}'`);
  });

  it("includes the day of week", () => {
    const d = new Date("2026-08-17T09:00:00"); // Monday
    const result = formatDateTime(d);
    assert.ok(result.toLowerCase().includes("lunes"), `expected 'lunes' in '${result}'`);
  });
});

describe("getEndTime", () => {
  it("adds minutes to a start date", () => {
    const start = new Date("2026-08-01T10:00:00");
    const end = getEndTime(start, 60);
    assert.strictEqual(end.getHours(), 11);
    assert.strictEqual(end.getMinutes(), 0);
  });

  it("handles 30-minute duration", () => {
    const start = new Date("2026-08-01T10:30:00");
    const end = getEndTime(start, 30);
    assert.strictEqual(end.getHours(), 11);
    assert.strictEqual(end.getMinutes(), 0);
  });

  it("handles 90-minute duration crossing the hour", () => {
    const start = new Date("2026-08-01T11:00:00");
    const end = getEndTime(start, 90);
    assert.strictEqual(end.getHours(), 12);
    assert.strictEqual(end.getMinutes(), 30);
  });

  it("does not mutate the original start date", () => {
    const start = new Date("2026-08-01T10:00:00");
    const originalTime = start.getTime();
    getEndTime(start, 60);
    assert.strictEqual(start.getTime(), originalTime);
  });
});

describe("cn (class name utility)", () => {
  it("merges class names", () => {
    const result = cn("foo", "bar");
    assert.ok(result.includes("foo"));
    assert.ok(result.includes("bar"));
  });

  it("handles conditional classes", () => {
    const result = cn("base", false && "skip", "included");
    assert.ok(!result.includes("skip"));
    assert.ok(result.includes("included"));
  });

  it("resolves tailwind conflicts (last wins)", () => {
    const result = cn("p-2", "p-4");
    assert.ok(result.includes("p-4"));
    assert.ok(!result.includes("p-2"));
  });

  it("handles undefined and null gracefully", () => {
    const result = cn("base", undefined, null as unknown as string);
    assert.ok(result.includes("base"));
  });
});
