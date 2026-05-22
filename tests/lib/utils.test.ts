import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatPrice, formatDuration, slugify, generateTimeSlots } from "@/lib/utils";

describe("formatPrice", () => {
  it("formats ARS cents correctly", () => {
    assert.ok(formatPrice(500000).includes("5.000"));
    assert.ok(formatPrice(0).includes("0"));
  });

  it("includes the amount when formatting 100 cents", () => {
    assert.ok(formatPrice(100).includes("1"));
  });
});

describe("formatDuration", () => {
  it("formats minutes under 60", () => {
    assert.strictEqual(formatDuration(30), "30 min");
    assert.strictEqual(formatDuration(45), "45 min");
  });

  it("formats exactly 60 minutes as 1h", () => {
    assert.strictEqual(formatDuration(60), "1h");
  });

  it("formats hours and remaining minutes", () => {
    assert.strictEqual(formatDuration(90), "1h 30min");
    assert.strictEqual(formatDuration(75), "1h 15min");
  });

  it("formats multiple full hours", () => {
    assert.strictEqual(formatDuration(120), "2h");
    assert.strictEqual(formatDuration(150), "2h 30min");
  });
});

describe("slugify", () => {
  it("lowercases and replaces spaces with dashes", () => {
    assert.strictEqual(slugify("Florencia Lucchini"), "florencia-lucchini");
  });

  it("removes accents", () => {
    assert.strictEqual(slugify("María García"), "maria-garcia");
  });

  it("removes special characters", () => {
    assert.strictEqual(slugify("Dr. Juan Pérez (MD)"), "dr-juan-perez-md");
  });

  it("collapses multiple spaces into a single dash", () => {
    assert.strictEqual(slugify("hello   world"), "hello-world");
  });

  it("trims leading and trailing whitespace", () => {
    assert.strictEqual(slugify("  hello  "), "hello");
  });
});

describe("generateTimeSlots", () => {
  const baseDate = new Date("2026-06-10T00:00:00.000Z");

  it("generates 9 slots of 60 min for 10:00–19:00", () => {
    const slots = generateTimeSlots("10:00", "19:00", 60, baseDate);
    assert.strictEqual(slots.length, 9);
  });

  it("generates 4 slots of 30 min for 09:00–11:00", () => {
    const slots = generateTimeSlots("09:00", "11:00", 30, baseDate);
    assert.strictEqual(slots.length, 4);
  });

  it("generates 2 slots of 90 min for 09:00–12:00", () => {
    const slots = generateTimeSlots("09:00", "12:00", 90, baseDate);
    assert.strictEqual(slots.length, 2);
  });

  it("does not include a slot that overflows the end time", () => {
    const slots = generateTimeSlots("10:00", "11:00", 60, baseDate);
    assert.strictEqual(slots.length, 1);
  });

  it("returns empty array when duration exceeds the range", () => {
    const slots = generateTimeSlots("10:00", "10:30", 60, baseDate);
    assert.strictEqual(slots.length, 0);
  });

  it("returns Date objects with the correct hours", () => {
    const slots = generateTimeSlots("10:00", "12:00", 60, baseDate);
    assert.strictEqual(slots[0].getHours(), 10);
    assert.strictEqual(slots[1].getHours(), 11);
  });
});
