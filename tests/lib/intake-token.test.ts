import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { generateIntakeToken, verifyIntakeToken } from "@/lib/intake-token";
import { generateCancelToken } from "@/lib/cancel-token";

before(() => {
  process.env.NEXTAUTH_SECRET = "test-secret-for-unit-tests";
});

describe("generateIntakeToken", () => {
  it("returns a 32-char lowercase hex string", () => {
    const token = generateIntakeToken("resp-001", new Date("2026-01-01T00:00:00Z"));
    assert.strictEqual(token.length, 32);
    assert.match(token, /^[0-9a-f]+$/);
  });

  it("is deterministic for the same inputs", () => {
    const date = new Date("2026-01-01T00:00:00Z");
    assert.strictEqual(
      generateIntakeToken("resp-1", date),
      generateIntakeToken("resp-1", date)
    );
  });

  it("produces a different token than cancel tokens for the same inputs", () => {
    const date = new Date("2026-01-01T00:00:00Z");
    assert.notStrictEqual(
      generateIntakeToken("resp-1", date),
      generateCancelToken("resp-1", date)
    );
  });
});

describe("verifyIntakeToken", () => {
  it("returns true for a valid token", () => {
    const id = "resp-abc";
    const date = new Date("2026-06-01T08:00:00Z");
    const token = generateIntakeToken(id, date);
    assert.strictEqual(verifyIntakeToken(token, id, date), true);
  });

  it("returns false for the wrong responseId", () => {
    const date = new Date("2026-06-01T08:00:00Z");
    const token = generateIntakeToken("resp-real", date);
    assert.strictEqual(verifyIntakeToken(token, "resp-fake", date), false);
  });

  it("returns false for a different date", () => {
    const id = "resp-abc";
    const token = generateIntakeToken(id, new Date("2026-06-01T08:00:00Z"));
    assert.strictEqual(verifyIntakeToken(token, id, new Date("2026-06-02T08:00:00Z")), false);
  });

  it("returns false for a tampered token", () => {
    const id = "resp-abc";
    const date = new Date("2026-06-01T08:00:00Z");
    assert.strictEqual(verifyIntakeToken("0000000000000000000000000000000f", id, date), false);
  });
});
