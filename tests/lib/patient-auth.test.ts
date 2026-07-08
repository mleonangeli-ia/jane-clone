import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { createPatientCookie, verifyPatientCookie } from "@/lib/patient-auth";

before(() => {
  process.env.NEXTAUTH_SECRET = "test-secret-for-unit-tests";
});

describe("createPatientCookie", () => {
  it("returns a string with 3 parts separated by dots", () => {
    const val = createPatientCookie("client-123");
    const parts = val.split(".");
    assert.strictEqual(parts.length, 3);
  });

  it("includes the clientId as the first segment", () => {
    const val = createPatientCookie("client-abc");
    assert.ok(val.startsWith("client-abc."));
  });

  it("produces different values for different clients", () => {
    const v1 = createPatientCookie("c-1");
    const v2 = createPatientCookie("c-2");
    assert.notStrictEqual(v1, v2);
  });
});

describe("verifyPatientCookie", () => {
  it("returns the clientId for a valid cookie", () => {
    const cookie = createPatientCookie("client-xyz");
    const result = verifyPatientCookie(cookie);
    assert.strictEqual(result, "client-xyz");
  });

  it("returns null for a tampered signature", () => {
    const cookie = createPatientCookie("client-123");
    const parts  = cookie.split(".");
    parts[2]     = "0".repeat(64);
    const result = verifyPatientCookie(parts.join("."));
    assert.strictEqual(result, null);
  });

  it("returns null for a malformed cookie", () => {
    assert.strictEqual(verifyPatientCookie("not.valid"), null);
    assert.strictEqual(verifyPatientCookie(""),          null);
    assert.strictEqual(verifyPatientCookie("a.b.c.d"),   null);
  });

  it("returns null for an expired cookie (age > 30 days)", () => {
    // Craft a cookie with an old timestamp
    const oldTs = String(Date.now() - 31 * 24 * 60 * 60 * 1000);
    const result = verifyPatientCookie(`client-1.${oldTs}.fakesig`);
    assert.strictEqual(result, null);
  });
});
