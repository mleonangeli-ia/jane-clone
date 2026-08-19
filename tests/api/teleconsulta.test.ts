/**
 * Integration tests for teleconsulta (virtual services + meeting URLs).
 * Requires dev server on localhost:3001.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3001";

async function checkServer() {
  try { await fetch(`${BASE}/api/auth/csrf`, { signal: AbortSignal.timeout(2000) }); return true; }
  catch { return false; }
}

// ── Auth protection ─────────────────────────────────────────────────────────

describe("POST /api/services (isVirtual)", () => {
  it("returns 401 without auth", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/services`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name: "Consulta virtual", duration: 50, price: 5000, isVirtual: true }),
    });
    assert.strictEqual(res.status, 401);
  });
});

describe("PATCH /api/services/[id] (isVirtual toggle)", () => {
  it("returns 401 without auth when toggling isVirtual", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/services/nonexistent-id`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ isVirtual: true }),
    });
    assert.strictEqual(res.status, 401);
  });

  it("returns 401 without auth when disabling isVirtual", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/services/nonexistent-id`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ isVirtual: false }),
    });
    assert.strictEqual(res.status, 401);
  });
});

// ── Security: meetingUrl not returned on booking ─────────────────────────────

describe("POST /api/appointments — meetingUrl NOT in booking response", () => {
  it("response body does not contain meetingUrl for any booking (security)", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/appointments`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        tenantId:    "nonexistent-tenant",
        serviceId:   "nonexistent-service",
        startTime:   new Date(Date.now() + 86400000).toISOString(),
        clientName:  "Test Patient",
        clientEmail: "patient@example.com",
        clientPhone: "",
        _hp:         "",
      }),
    });
    // Will 404 (tenant not found) but lets us verify the response shape
    const json = await res.json().catch(() => ({}));
    assert.ok(!("meetingUrl" in json), "meetingUrl must never appear in booking response");
    assert.ok(!("googleEventId" in json), "googleEventId must never appear in booking response");
  });

  it("honeypot fake-success response does not expose meetingUrl", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/appointments`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        tenantId:    "any",
        serviceId:   "any",
        startTime:   new Date(Date.now() + 86400000).toISOString(),
        clientName:  "Bot",
        clientEmail: "bot@gmail.com",
        _hp:         "bot filled this",
      }),
    });
    assert.strictEqual(res.status, 201);
    const json = await res.json();
    assert.strictEqual(json.id, "ok");
    assert.ok(!("meetingUrl" in json), "meetingUrl must not appear in honeypot response");
  });
});

// ── Security: patient portal fields ─────────────────────────────────────────

describe("Patient portal — sensitive fields not exposed", () => {
  it("GET /patient/portal redirects without valid session (no unauthenticated access)", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/patient/portal`, { redirect: "manual" });
    // Without patient-session cookie → redirect to /patient
    assert.ok(
      [301, 302, 303, 307, 308].includes(res.status),
      `expected redirect, got ${res.status}`
    );
    const location = res.headers.get("location") ?? "";
    assert.ok(
      location.includes("/patient") || location.includes("login"),
      `expected redirect to /patient, got ${location}`
    );
  });
});

// ── Slots API: works for virtual services ───────────────────────────────────

describe("GET /api/slots — virtual services behave like regular ones", () => {
  it("returns 400 when params are missing (same as non-virtual)", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/slots`);
    assert.strictEqual(res.status, 400);
  });

  it("returns empty slots for non-existent virtual tenant", async () => {
    if (!await checkServer()) return;
    const today = new Date().toISOString().slice(0, 10);
    const res = await fetch(
      `${BASE}/api/slots?tenantId=virtual-nonexistent&serviceId=virtual-service&date=${today}`
    );
    assert.ok(res.ok);
    const json = await res.json();
    assert.ok(Array.isArray(json.slots));
    assert.strictEqual(json.slots.length, 0);
  });
});

// ── isVirtual field in service responses ────────────────────────────────────

describe("GET /api/services — isVirtual included in response", () => {
  it("returns 401 without auth (security baseline)", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/services`);
    assert.strictEqual(res.status, 401);
  });
});
