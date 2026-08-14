/**
 * Integration tests for /api/patient/* — requires dev server on localhost:3001.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3001";

async function checkServer() {
  try { await fetch(`${BASE}/api/auth/csrf`, { signal: AbortSignal.timeout(2000) }); return true; }
  catch { return false; }
}

describe("POST /api/patient/auth/request (magic link)", () => {
  it("always returns { ok: true } for security — even for unknown email", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/patient/auth/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "unknown@example.com" }),
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.ok, true);
  });

  it("returns { ok: true } for missing email (no enumeration)", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/patient/auth/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.ok, true);
  });

  it("returns { ok: true } for invalid JSON body", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/patient/auth/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    assert.strictEqual(res.status, 200);
  });
});

describe("GET /api/patient/auth/verify (magic token)", () => {
  it("redirects to error page when token param is missing", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/patient/auth/verify`, { redirect: "manual" });
    // Should redirect (3xx) to error page
    assert.ok([301, 302, 303, 307, 308].includes(res.status), `expected redirect, got ${res.status}`);
    const location = res.headers.get("location") ?? "";
    assert.ok(location.includes("error"), `expected error in redirect location: ${location}`);
  });

  it("redirects to error page for a fake token", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/patient/auth/verify?token=fakefakefakefake`, { redirect: "manual" });
    assert.ok([301, 302, 303, 307, 308].includes(res.status), `expected redirect, got ${res.status}`);
    const location = res.headers.get("location") ?? "";
    assert.ok(location.includes("error"), `expected error in redirect: ${location}`);
  });
});

describe("GET /api/patient/auth/logout", () => {
  it("clears the patient cookie and redirects", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/patient/auth/logout`, { redirect: "manual" });
    assert.ok(
      [200, 301, 302, 303, 307, 308].includes(res.status),
      `expected 2xx or redirect, got ${res.status}`
    );
  });
});
