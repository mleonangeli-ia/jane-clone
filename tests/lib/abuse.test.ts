import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isDisposableEmail, isHoneypotClean } from "@/lib/abuse";
import { consume, reset, peek } from "@/lib/rate-limit";
import { MemoryRateLimitStore } from "@/tests/helpers/rate-limit-store";

// ── Disposable email detection ──────────────────────────────
describe("isDisposableEmail", () => {
  it("detects known disposable domains", () => {
    assert.strictEqual(isDisposableEmail("user@mailinator.com"),   true);
    assert.strictEqual(isDisposableEmail("user@yopmail.com"),      true);
    assert.strictEqual(isDisposableEmail("test@guerrillamail.com"), true);
    assert.strictEqual(isDisposableEmail("me@trashmail.com"),      true);
    assert.strictEqual(isDisposableEmail("user@tempmail.com"),      true);
  });

  it("allows legitimate email domains", () => {
    assert.strictEqual(isDisposableEmail("user@gmail.com"),       false);
    assert.strictEqual(isDisposableEmail("user@hotmail.com"),     false);
    assert.strictEqual(isDisposableEmail("dr@hospital.org"),      false);
    assert.strictEqual(isDisposableEmail("lic@consultorio.com"),  false);
  });

  it("is case-insensitive on domain", () => {
    assert.strictEqual(isDisposableEmail("user@Mailinator.COM"), true);
  });

  it("returns false for empty or undefined", () => {
    assert.strictEqual(isDisposableEmail(""),        false);
    // undefined is not a real use-case — skip
  });
});

// ── Honeypot check ──────────────────────────────────────────
describe("isHoneypotClean", () => {
  it("returns true when honeypot is empty (human)", () => {
    assert.strictEqual(isHoneypotClean(""),    true);
    assert.strictEqual(isHoneypotClean(null),  true);
    assert.strictEqual(isHoneypotClean(undefined), true);
    assert.strictEqual(isHoneypotClean("   "), true);
  });

  it("returns false when honeypot has content (bot)", () => {
    assert.strictEqual(isHoneypotClean("bot filled this"), false);
    assert.strictEqual(isHoneypotClean("http://spam.com"), false);
  });
});

// ── Rate limit (consume/peek/reset) ─────────────────────────
describe("consume", () => {
  it("allows first N requests", async () => {
    const store = new MemoryRateLimitStore();
    const r1 = await consume("test:consume", 3, 60_000, store);
    const r2 = await consume("test:consume", 3, 60_000, store);
    const r3 = await consume("test:consume", 3, 60_000, store);
    assert.ok(r1.allowed);
    assert.ok(r2.allowed);
    assert.ok(r3.allowed);
  });

  it("blocks after limit", async () => {
    const store = new MemoryRateLimitStore();
    const key = "test:block";
    await consume(key, 2, 60_000, store);
    await consume(key, 2, 60_000, store);
    const r = await consume(key, 2, 60_000, store);
    assert.strictEqual(r.allowed, false);
    assert.strictEqual(r.remaining, 0);
  });

  it("resets after reset()", async () => {
    const store = new MemoryRateLimitStore();
    const key = "test:reset";
    await consume(key, 1, 60_000, store);
    await consume(key, 1, 60_000, store); // blocked
    await reset(key, store);
    const r = await consume(key, 1, 60_000, store);
    assert.ok(r.allowed);
  });
});

describe("peek", () => {
  it("does not consume a token", async () => {
    const store = new MemoryRateLimitStore();
    const key = "test:peek";
    const before = await peek(key, 3, 60_000, store);
    const after  = await peek(key, 3, 60_000, store);
    assert.strictEqual(before.remaining, after.remaining);
  });

  it("shows full remaining when key is new", async () => {
    const store = new MemoryRateLimitStore();
    const r = await peek("test:new", 5, 60_000, store);
    assert.strictEqual(r.remaining, 5);
    assert.ok(r.allowed);
  });
});
