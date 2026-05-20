import { describe, it, expect, beforeAll } from "vitest";
import { generateIntakeToken, verifyIntakeToken } from "@/lib/intake-token";

beforeAll(() => {
  process.env.NEXTAUTH_SECRET = "test-secret-for-unit-tests";
});

describe("generateIntakeToken", () => {
  it("returns a 32-char hex string", () => {
    const token = generateIntakeToken("resp-001", new Date("2026-01-01T00:00:00Z"));
    expect(token).toHaveLength(32);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  it("is deterministic for the same inputs", () => {
    const date = new Date("2026-01-01T00:00:00Z");
    expect(generateIntakeToken("resp-1", date)).toBe(generateIntakeToken("resp-1", date));
  });

  it("is distinct from cancel tokens for the same inputs", () => {
    // intake prefixes the HMAC data with "intake:" so tokens differ
    const { generateCancelToken } = await import("@/lib/cancel-token");
    const date = new Date("2026-01-01T00:00:00Z");
    const cancelTok = generateCancelToken("resp-1", date);
    const intakeTok = generateIntakeToken("resp-1", date);
    expect(cancelTok).not.toBe(intakeTok);
  });
});

describe("verifyIntakeToken", () => {
  it("returns true for a valid token", () => {
    const id = "resp-abc";
    const date = new Date("2026-06-01T08:00:00Z");
    const token = generateIntakeToken(id, date);
    expect(verifyIntakeToken(token, id, date)).toBe(true);
  });

  it("returns false for wrong responseId", () => {
    const date = new Date("2026-06-01T08:00:00Z");
    const token = generateIntakeToken("resp-real", date);
    expect(verifyIntakeToken(token, "resp-fake", date)).toBe(false);
  });

  it("returns false for wrong date", () => {
    const id = "resp-abc";
    const token = generateIntakeToken(id, new Date("2026-06-01T08:00:00Z"));
    expect(verifyIntakeToken(token, id, new Date("2026-06-02T08:00:00Z"))).toBe(false);
  });
});
