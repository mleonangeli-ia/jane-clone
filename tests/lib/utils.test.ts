import { describe, it, expect } from "vitest";
import { formatPrice, formatDuration, slugify, generateTimeSlots } from "@/lib/utils";

describe("formatPrice", () => {
  it("formats ARS cents correctly", () => {
    expect(formatPrice(500000)).toBe("$5.000");
    expect(formatPrice(100)).toBe("$1");
    expect(formatPrice(0)).toBe("$0");
  });

  it("formats USD when currency is passed", () => {
    const result = formatPrice(1000, "USD");
    expect(result).toContain("10");
  });
});

describe("formatDuration", () => {
  it("formats minutes under 60", () => {
    expect(formatDuration(30)).toBe("30 min");
    expect(formatDuration(45)).toBe("45 min");
  });

  it("formats exactly 60 minutes as 1h", () => {
    expect(formatDuration(60)).toBe("1h");
  });

  it("formats hours and minutes", () => {
    expect(formatDuration(90)).toBe("1h 30min");
    expect(formatDuration(75)).toBe("1h 15min");
  });

  it("formats multiple hours", () => {
    expect(formatDuration(120)).toBe("2h");
    expect(formatDuration(150)).toBe("2h 30min");
  });
});

describe("slugify", () => {
  it("lowercases and replaces spaces with dashes", () => {
    expect(slugify("Florencia Lucchini")).toBe("florencia-lucchini");
  });

  it("removes accents", () => {
    expect(slugify("María García")).toBe("maria-garcia");
  });

  it("removes special characters", () => {
    expect(slugify("Dr. Juan Pérez (MD)")).toBe("dr-juan-perez-md");
  });

  it("collapses multiple dashes", () => {
    expect(slugify("hello   world")).toBe("hello-world");
  });

  it("trims leading and trailing dashes", () => {
    expect(slugify("  hello  ")).toBe("hello");
  });
});

describe("generateTimeSlots", () => {
  const baseDate = new Date("2026-06-10T00:00:00.000Z");

  it("generates correct number of 60-min slots for 10:00–19:00", () => {
    const slots = generateTimeSlots("10:00", "19:00", 60, baseDate);
    // 9 slots: 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00, 17:00, 18:00
    expect(slots).toHaveLength(9);
  });

  it("generates correct number of 30-min slots for 09:00–11:00", () => {
    const slots = generateTimeSlots("09:00", "11:00", 30, baseDate);
    // 4 slots: 09:00, 09:30, 10:00, 10:30
    expect(slots).toHaveLength(4);
  });

  it("generates correct number of 90-min slots for 09:00–12:00", () => {
    const slots = generateTimeSlots("09:00", "12:00", 90, baseDate);
    // 2 slots: 09:00, 10:30
    expect(slots).toHaveLength(2);
  });

  it("does not include a slot that would overflow the end time", () => {
    // 10:00–11:00 with 60-min slot → only 10:00, since 11:00+60 > 11:00
    const slots = generateTimeSlots("10:00", "11:00", 60, baseDate);
    expect(slots).toHaveLength(1);
  });

  it("returns empty array when duration exceeds range", () => {
    const slots = generateTimeSlots("10:00", "10:30", 60, baseDate);
    expect(slots).toHaveLength(0);
  });

  it("slots are Date objects with correct hours", () => {
    const slots = generateTimeSlots("10:00", "12:00", 60, baseDate);
    expect(slots[0].getHours()).toBe(10);
    expect(slots[1].getHours()).toBe(11);
  });
});
