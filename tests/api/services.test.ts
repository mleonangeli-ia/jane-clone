/**
 * Integration tests for /api/services — requires dev server on localhost:3001.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3001";

async function checkServer() {
  try { await fetch(`${BASE}/api/auth/csrf`, { signal: AbortSignal.timeout(2000) }); return true; }
  catch { return false; }
}

describe("GET /api/services", () => {
  it("returns 401 without auth", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/services`);
    assert.strictEqual(res.status, 401);
  });
});

describe("POST /api/services", () => {
  it("returns 401 without auth", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Service", duration: 60, price: 5000 }),
    });
    assert.strictEqual(res.status, 401);
  });
});

describe("PUT /api/services/[id]", () => {
  it("returns 401 without auth", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/services/nonexistent-id`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated", duration: 60, price: 6000 }),
    });
    assert.strictEqual(res.status, 401);
  });
});

describe("DELETE /api/services/[id]", () => {
  it("returns 401 without auth", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/services/nonexistent-id`, { method: "DELETE" });
    assert.strictEqual(res.status, 401);
  });
});
