import { describe, it, expect, beforeAll } from "vitest";
import { generateCancelToken, verifyCancelToken } from "@/lib/cancel-token";

beforeAll(() => {
  process.env.NEXTAUTH_SECRET = "test-secret-for-unit-tests";
});

describe("generateCancelToken", () => {
  it("returns a 32-character hex string", () => {
    const token = generateCancelToken("appt-123", new Date("2026-01-01T00:00:00Z"));
    expect(token).toHaveLength(32);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  it("produces the same token for the same inputs", () => {
    const date = new Date("2026-01-01T00:00:00Z");
    const t1 = generateCancelToken("appt-abc", date);
    const t2 = generateCancelToken("appt-abc", date);
    expect(t1).toBe(t2);
  });

  it("produces different tokens for different appointment IDs", () => {
    const date = new Date("2026-01-01T00:00:00Z");
    const t1 = generateCancelToken("appt-1", date);
    const t2 = generateCancelToken("appt-2", date);
    expect(t1).not.toBe(t2);
  });

  it("produces different tokens for different dates", () => {
    const t1 = generateCancelToken("appt-1", new Date("2026-01-01T00:00:00Z"));
    const t2 = generateCancelToken("appt-1", new Date("2026-01-02T00:00:00Z"));
    expect(t1).not.toBe(t2);
  });
});

describe("verifyCancelToken", () => {
  it("returns true for a valid token", () => {
    const id = "appt-xyz";
    const date = new Date("2026-05-20T12:00:00Z");
    const token = generateCancelToken(id, date);
    expect(verifyCancelToken(token, id, date)).toBe(true);
  });

  it("returns false for a tampered token", () => {
    const id = "appt-xyz";
    const date = new Date("2026-05-20T12:00:00Z");
    expect(verifyCancelToken("deadbeef00000000deadbeef00000000", id, date)).toBe(false);
  });

  it("returns false when appointment ID doesn't match", () => {
    const date = new Date("2026-05-20T12:00:00Z");
    const token = generateCancelToken("appt-real", date);
    expect(verifyCancelToken(token, "appt-fake", date)).toBe(false);
  });

  it("returns false when date doesn't match", () => {
    const id = "appt-123";
    const token = generateCancelToken(id, new Date("2026-05-20T12:00:00Z"));
    expect(verifyCancelToken(token, id, new Date("2026-05-21T12:00:00Z"))).toBe(false);
  });
});
