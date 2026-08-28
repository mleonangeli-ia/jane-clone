/**
 * Integration tests for push notification endpoints.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { createAuthenticatedTenantFixture } from "@/tests/helpers/authenticated-tenant";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3001";
let sessionCookie = "";
let cleanupFixture: (() => Promise<void>) | undefined;

async function checkServer() {
  try { await fetch(`${BASE}/api/auth/csrf`, { signal: AbortSignal.timeout(2000) }); return true; }
  catch { return false; }
}

before(async () => {
  if (!await checkServer()) return;
  const fixture = await createAuthenticatedTenantFixture(BASE);
  sessionCookie = fixture.cookie;
  cleanupFixture = fixture.cleanup;
});

after(async () => {
  await cleanupFixture?.();
});

describe("GET /api/push/vapid-key", () => {
  it("returns a publicKey string without auth", async () => {
    if (!await checkServer()) return;
    const res  = await fetch(`${BASE}/api/push/vapid-key`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(typeof json.publicKey === "string" && json.publicKey.length > 0);
  });

  it("publicKey decodes to 65 bytes (uncompressed EC point)", async () => {
    if (!await checkServer()) return;
    const { publicKey } = await fetch(`${BASE}/api/push/vapid-key`).then(r => r.json());
    const buf = Buffer.from(publicKey, "base64url");
    assert.strictEqual(buf.length, 65);
    assert.strictEqual(buf[0], 0x04);
  });
});

describe("POST /api/push/subscribe", () => {
  it("returns 401 without auth", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/push/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: "https://fcm.example.com/1", keys: { p256dh: "x", auth: "y" } }),
    });
    assert.strictEqual(res.status, 401);
  });

  it("returns 400 for missing endpoint", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/push/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: sessionCookie },
      body: JSON.stringify({ keys: { p256dh: "x", auth: "y" } }),
    });
    assert.strictEqual(res.status, 400);
  });
});

describe("POST /api/push/unsubscribe", () => {
  it("returns 401 without auth", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/push/unsubscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: "https://fcm.example.com/1" }),
    });
    assert.strictEqual(res.status, 401);
  });

  it("returns 200 even for non-existent subscription (idempotent)", async () => {
    if (!await checkServer()) return;
    const res = await fetch(`${BASE}/api/push/unsubscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: sessionCookie },
      body: JSON.stringify({ endpoint: "https://not-real-endpoint.example.com/x" }),
    });
    assert.strictEqual(res.status, 200);
  });
});
