import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { generateInvoiceToken, verifyInvoiceToken } from "@/lib/invoice-token";

before(() => {
  process.env.NEXTAUTH_SECRET = "test-secret-for-unit-tests";
});

describe("generateInvoiceToken", () => {
  it("returns a 32-character lowercase hex string", () => {
    const token = generateInvoiceToken("inv-001", new Date("2026-01-01T00:00:00Z"));
    assert.strictEqual(token.length, 32);
    assert.match(token, /^[0-9a-f]+$/);
  });

  it("is deterministic for the same inputs", () => {
    const date = new Date("2026-01-01T00:00:00Z");
    const t1   = generateInvoiceToken("inv-1", date);
    const t2   = generateInvoiceToken("inv-1", date);
    assert.strictEqual(t1, t2);
  });

  it("differs for different invoice IDs", () => {
    const date = new Date("2026-01-01T00:00:00Z");
    assert.notStrictEqual(
      generateInvoiceToken("inv-1", date),
      generateInvoiceToken("inv-2", date)
    );
  });

  it("differs for different creation dates", () => {
    const t1 = generateInvoiceToken("inv-1", new Date("2026-01-01T00:00:00Z"));
    const t2 = generateInvoiceToken("inv-1", new Date("2026-06-01T00:00:00Z"));
    assert.notStrictEqual(t1, t2);
  });
});

describe("verifyInvoiceToken", () => {
  it("returns true for a valid token", () => {
    const date  = new Date("2026-01-01T00:00:00Z");
    const token = generateInvoiceToken("inv-1", date);
    assert.strictEqual(verifyInvoiceToken(token, "inv-1", date), true);
  });

  it("returns false for a tampered token", () => {
    const date  = new Date("2026-01-01T00:00:00Z");
    const token = generateInvoiceToken("inv-1", date);
    const bad   = token.slice(0, -2) + "00";
    assert.strictEqual(verifyInvoiceToken(bad, "inv-1", date), false);
  });

  it("returns false when invoice ID doesn't match", () => {
    const date  = new Date("2026-01-01T00:00:00Z");
    const token = generateInvoiceToken("inv-1", date);
    assert.strictEqual(verifyInvoiceToken(token, "inv-2", date), false);
  });
});
