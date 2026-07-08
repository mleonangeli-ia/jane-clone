import { describe, it, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { isDisposableEmail, isHoneypotClean } from "@/lib/abuse";
import { consume, reset, peek } from "@/lib/rate-limit";

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
  const KEY = `test:consume:${Date.now()}`;

  it("allows first N requests", () => {
    const r1 = consume(KEY, 3, 60_000);
    const r2 = consume(KEY, 3, 60_000);
    const r3 = consume(KEY, 3, 60_000);
    assert.ok(r1.allowed);
    assert.ok(r2.allowed);
    assert.ok(r3.allowed);
  });

  it("blocks after limit", () => {
    const key  = `test:block:${Date.now()}`;
    consume(key, 2, 60_000);
    consume(key, 2, 60_000);
    const r = consume(key, 2, 60_000);
    assert.strictEqual(r.allowed, false);
    assert.strictEqual(r.remaining, 0);
  });

  it("resets after reset()", () => {
    const key = `test:reset:${Date.now()}`;
    consume(key, 1, 60_000);
    consume(key, 1, 60_000); // blocked
    reset(key);
    const r = consume(key, 1, 60_000);
    assert.ok(r.allowed);
  });
});

describe("peek", () => {
  it("does not consume a token", () => {
    const key = `test:peek:${Date.now()}`;
    const before = peek(key, 3, 60_000);
    const after  = peek(key, 3, 60_000);
    assert.strictEqual(before.remaining, after.remaining);
  });

  it("shows full remaining when key is new", () => {
    const r = peek(`test:new:${Date.now()}`, 5, 60_000);
    assert.strictEqual(r.remaining, 5);
    assert.ok(r.allowed);
  });
});
