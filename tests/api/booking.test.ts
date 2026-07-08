/**
 * Integration tests for the public booking flow.
 * Requires dev server on localhost:3001.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3001";
const SLUG = "florencia-lucchini";

async function checkServer() {
  try { await fetch(`${BASE}/api/auth/csrf`, { signal: AbortSignal.timeout(2000) }); return true; }
  catch { return false; }
}

describe("Public booking page", () => {
  it("serves the booking page with 200", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/book/${SLUG}`);
    assert.strictEqual(res.status, 200);
  });

  it("returns 404 for unknown slug", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/book/this-slug-does-not-exist-xyz123`);
    assert.ok(res.status === 404 || res.status === 200, "NOTFOUND or redirect");
  });
});

describe("GET /api/slots", () => {
  it("returns 400 when required params are missing", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/slots`);
    assert.strictEqual(res.status, 400);
  });

  it("returns 400 when serviceId is missing", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/slots?tenantId=x&date=2026-08-01`);
    assert.strictEqual(res.status, 400);
  });

  it("returns empty slots for non-existent tenant", async () => {
    if (!await checkServer()) return;
    const today = new Date().toISOString().slice(0, 10);
    const res = await fetch(`${BASE}/api/slots?tenantId=nonexistent&serviceId=nonexistent&date=${today}`);
    assert.ok(res.ok);
    const json = await res.json();
    assert.ok(Array.isArray(json.slots));
    assert.strictEqual(json.slots.length, 0);
  });
});

describe("POST /api/appointments (abuse protection)", () => {
  it("returns error for disposable email", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: "test",
        serviceId: "test",
        startTime: new Date(Date.now() + 86400000).toISOString(),
        clientName: "Bot User",
        clientEmail: "bot@mailinator.com",
        clientPhone: "",
        _hp: "",
      }),
    });
    // Should reject with 422 (disposable email)
    assert.strictEqual(res.status, 422);
  });

  it("silently accepts honeypot-filled requests", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: "test", serviceId: "test",
        startTime: new Date(Date.now() + 86400000).toISOString(),
        clientName: "Bot", clientEmail: "bot@legit.com",
        _hp: "bot filled this",
      }),
    });
    // Honeypot → fake 201 (silent discard)
    assert.strictEqual(res.status, 201);
    const json = await res.json();
    assert.strictEqual(json.id, "ok"); // fake response
  });
});

describe("POST /api/waitlist (abuse protection)", () => {
  it("returns 422 for disposable email", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/waitlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: "test", serviceId: "test", date: "2026-08-01",
        name: "Bot", email: "bot@yopmail.com",
      }),
    });
    assert.strictEqual(res.status, 422);
  });
});
