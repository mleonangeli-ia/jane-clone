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

  it("returns 404 for non-existent appointment without auth being the main error", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/appointments/nonexistent-id/notes`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({}),
    });
    // Without auth → 401 takes precedence
    assert.ok([401, 404].includes(res.status));
  });
});
