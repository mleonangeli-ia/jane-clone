/**
 * Integration tests for /api/intake-forms — requires dev server on localhost:3001.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3001";

async function checkServer() {
  try { await fetch(`${BASE}/api/auth/csrf`, { signal: AbortSignal.timeout(2000) }); return true; }
  catch { return false; }
}

describe("GET /api/intake-forms", () => {
  it("returns 401 without auth", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/intake-forms`);
    assert.strictEqual(res.status, 401);
  });
});

describe("POST /api/intake-forms", () => {
  it("returns 401 without auth", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/intake-forms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Form", fields: [] }),
    });
    assert.strictEqual(res.status, 401);
  });
});

describe("GET /api/intake/[responseId] (public intake form)", () => {
  it("returns 404 for non-existent response token", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/intake/nonexistent-response-id`);
    assert.ok([404, 400].includes(res.status), `expected 404 or 400, got ${res.status}`);
  });
});
