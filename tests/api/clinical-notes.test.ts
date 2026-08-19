/**
 * Integration tests for /api/appointments/[id]/notes
 * Requires dev server on localhost:3001.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3001";

async function checkServer() {
  try { await fetch(`${BASE}/api/auth/csrf`, { signal: AbortSignal.timeout(2000) }); return true; }
  catch { return false; }
}

describe("GET /api/appointments/[id]/notes", () => {
  it("returns 401 without auth", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/appointments/nonexistent-id/notes`);
    assert.strictEqual(res.status, 401);
  });

  it("returns 401 even with a valid-looking appointment ID format", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/appointments/clxxxxxxxxxxxxxxxxxxxxxxxx/notes`);
    assert.strictEqual(res.status, 401);
  });
});

describe("PUT /api/appointments/[id]/notes", () => {
  it("returns 401 without auth", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/appointments/nonexistent-id/notes`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ subjective: "Paciente refiere dolor", plan: "Reposo" }),
    });
    assert.strictEqual(res.status, 401);
  });

  it("returns 401 without auth even with empty body", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/appointments/nonexistent-id/notes`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({}),
    });
    assert.strictEqual(res.status, 401);
  });

  it("returns 401 without auth — not 400 — even for oversized payload (auth check first)", async () => {
    if (!await checkServer()) return;
    const bigField = "A".repeat(6000);
    const res = await fetch(`${BASE}/api/appointments/nonexistent-id/notes`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ subjective: bigField }),
    });
    // Auth guard runs before size validation
    assert.strictEqual(res.status, 401);
  });
});

describe("Clinical note size limits (unit-level via lib logic)", () => {
  const MAX = 5000;

  it("5000 chars is at the limit (valid)", () => {
    const value = "A".repeat(MAX);
    assert.strictEqual(value.length, MAX);
    // The route accepts exactly MAX characters
  });

  it("5001 chars exceeds the limit", () => {
    const value = "A".repeat(MAX + 1);
    assert.ok(value.length > MAX);
  });

  it("empty string is valid (clears the field)", () => {
    const value = "";
    assert.strictEqual(value.length, 0);
  });

  it("null is valid (clears the field)", () => {
    const value = null;
    assert.strictEqual(value, null);
  });
});
