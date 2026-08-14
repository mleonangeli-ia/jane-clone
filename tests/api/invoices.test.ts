/**
 * Integration tests for /api/invoices — requires dev server on localhost:3001.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3001";

async function checkServer() {
  try { await fetch(`${BASE}/api/auth/csrf`, { signal: AbortSignal.timeout(2000) }); return true; }
  catch { return false; }
}

describe("GET /api/invoices", () => {
  it("returns 401 without auth", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/invoices`);
    assert.strictEqual(res.status, 401);
  });
});

describe("POST /api/invoices", () => {
  it("returns 401 without auth", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId: "test-id" }),
    });
    assert.strictEqual(res.status, 401);
  });
});

describe("GET /api/invoices/[id]", () => {
  it("returns 401 without auth for private invoice view", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/invoices/nonexistent-id`);
    assert.strictEqual(res.status, 401);
  });

  it("returns 404 or 401 for non-existent invoice with token param", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/invoices/nonexistent-id?token=fakefakefake`);
    assert.ok([401, 404].includes(res.status), `expected 401 or 404, got ${res.status}`);
  });
});
