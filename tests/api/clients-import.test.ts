/**
 * Integration tests for CSV import/export endpoints.
 * Requires the dev server running on localhost:3001.
 * Skipped automatically if server is not available.
 */
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3001";
const DEMO_EMAIL = "demo@janeclone.com";
const DEMO_PASS  = "demo1234";

let sessionCookie = "";

async function login() {
  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ email: DEMO_EMAIL, password: DEMO_PASS }),
    redirect: "manual",
  });
  const setCookie = res.headers.get("set-cookie") ?? "";
  sessionCookie = setCookie.split(";")[0];
}

async function checkServer(): Promise<boolean> {
  try {
    const r = await fetch(`${BASE}/api/auth/csrf`, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch { return false; }
}

describe("GET /api/clients/export", () => {
  before(async () => {
    if (!await checkServer()) return;
    await login();
  });

  it("returns CSV with correct headers", async () => {
    if (!await checkServer()) return; // skip if no server

    const res = await fetch(`${BASE}/api/clients/export`, {
      headers: { Cookie: sessionCookie },
    });

    assert.strictEqual(res.status, 200);
    const ct = res.headers.get("content-type") ?? "";
    assert.ok(ct.includes("text/csv"), `expected CSV, got ${ct}`);

    const text = await res.text();
    const firstLine = text.replace(/^﻿/, "").split("\n")[0]; // strip BOM
    assert.ok(firstLine.includes("Nombre"),        "has Nombre column");
    assert.ok(firstLine.includes("Email"),         "has Email column");
    assert.ok(firstLine.includes("Revenue total"), "has Revenue total column");
  });

  it("returns 401 without auth", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/clients/export`);
    assert.strictEqual(res.status, 401);
  });
});

describe("POST /api/clients/import", () => {
  before(async () => {
    if (!await checkServer()) return;
    await login();
  });

  it("imports valid CSV and returns counts", async () => {
    if (!await checkServer()) return;

    const csv = [
      "Nombre,Email,Teléfono",
      "Test Import,testimport@janeclone-test.com,+54 11 0000-0001",
    ].join("\n");

    const form = new FormData();
    form.append("file", new Blob([csv], { type: "text/csv" }), "test.csv");

    const res  = await fetch(`${BASE}/api/clients/import`, {
      method: "POST",
      headers: { Cookie: sessionCookie },
      body: form,
    });

    assert.ok(res.status === 200 || res.status === 201, `status ${res.status}`);
    const json = await res.json();
    assert.ok(typeof json.created  === "number", "has created count");
    assert.ok(typeof json.updated  === "number", "has updated count");
    assert.ok(typeof json.skipped  === "number", "has skipped count");
    assert.ok(Array.isArray(json.errors),        "has errors array");
  });

  it("returns 400 when CSV is missing required columns", async () => {
    if (!await checkServer()) return;

    const csv = "Teléfono\n+54 11 0000-0001";
    const form = new FormData();
    form.append("file", new Blob([csv], { type: "text/csv" }), "bad.csv");

    const res = await fetch(`${BASE}/api/clients/import`, {
      method: "POST",
      headers: { Cookie: sessionCookie },
      body: form,
    });
    assert.strictEqual(res.status, 400);
  });

  it("returns 400 when no file is sent", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/clients/import`, {
      method: "POST",
      headers: { Cookie: sessionCookie, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.ok(res.status >= 400, `expected 4xx, got ${res.status}`);
  });
});
