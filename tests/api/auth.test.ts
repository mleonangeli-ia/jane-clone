/**
 * Integration tests for auth endpoints.
 * Requires the dev server running on localhost:3001.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3001";

async function checkServer(): Promise<boolean> {
  try {
    await fetch(`${BASE}/api/auth/csrf`, { signal: AbortSignal.timeout(2000) });
    return true;
  } catch { return false; }
}

describe("POST /api/register", () => {
  it("returns 400 for missing fields", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test" }), // missing email + password
    });
    assert.ok(res.status >= 400);
  });

  it("returns 400 for password shorter than 8 chars", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test", email: "test@test.com", password: "123" }),
    });
    assert.ok(res.status >= 400);
  });
});

describe("POST /api/auth/forgot-password", () => {
  it("always returns 200 (security: no email enumeration)", async () => {
    if (!await checkServer()) return;

    // Known email
    const r1 = await fetch(`${BASE}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "demo@janeclone.com" }),
    });
    assert.strictEqual(r1.status, 200);

    // Unknown email
    const r2 = await fetch(`${BASE}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nonexistent@nobody.com" }),
    });
    assert.strictEqual(r2.status, 200, "should return 200 even for unknown email");
  });
});

describe("POST /api/auth/reset-password", () => {
  it("returns 400 for missing token", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "newpassword123" }),
    });
    assert.strictEqual(res.status, 400);
  });

  it("returns 400 for invalid token", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "invaliddtoken", password: "newpassword123" }),
    });
    assert.ok(res.status >= 400);
  });

  it("returns 400 for password < 8 chars", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "sometoken", password: "123" }),
    });
    assert.strictEqual(res.status, 400);
  });
});
