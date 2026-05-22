import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { generateCancelToken, verifyCancelToken } from "@/lib/cancel-token";

before(() => {
  process.env.NEXTAUTH_SECRET = "test-secret-for-unit-tests";
});

describe("generateCancelToken", () => {
  it("returns a 32-character lowercase hex string", () => {
    const token = generateCancelToken("appt-123", new Date("2026-01-01T00:00:00Z"));
    assert.strictEqual(token.length, 32);
    assert.match(token, /^[0-9a-f]+$/);
  });

  it("is deterministic for the same inputs", () => {
    const date = new Date("2026-01-01T00:00:00Z");
    assert.strictEqual(
      generateCancelToken("appt-abc", date),
      generateCancelToken("appt-abc", date)
    );
  });

  it("differs for different appointment IDs", () => {
    const date = new Date("2026-01-01T00:00:00Z");
    assert.notStrictEqual(
      generateCancelToken("appt-1", date),
      generateCancelToken("appt-2", date)
    );
  });

  it("differs for different dates", () => {
    assert.notStrictEqual(
      generateCancelToken("appt-1", new Date("2026-01-01T00:00:00Z")),
      generateCancelToken("appt-1", new Date("2026-01-02T00:00:00Z"))
    );
  });
});

describe("verifyCancelToken", () => {
  it("returns true for a valid token", () => {
    const id = "appt-xyz";
    const date = new Date("2026-05-20T12:00:00Z");
    const token = generateCancelToken(id, date);
    assert.strictEqual(verifyCancelToken(token, id, date), true);
  });

  it("returns false for a tampered token", () => {
    const id = "appt-xyz";
    const date = new Date("2026-05-20T12:00:00Z");
    assert.strictEqual(verifyCancelToken("deadbeef00000000deadbeef00000000", id, date), false);
  });

  it("returns false when appointment ID doesn't match", () => {
    const date = new Date("2026-05-20T12:00:00Z");
    const token = generateCancelToken("appt-real", date);
    assert.strictEqual(verifyCancelToken(token, "appt-fake", date), false);
  });

  it("returns false when date doesn't match", () => {
    const id = "appt-123";
    const token = generateCancelToken(id, new Date("2026-05-20T12:00:00Z"));
    assert.strictEqual(verifyCancelToken(token, id, new Date("2026-05-21T12:00:00Z")), false);
  });
});
