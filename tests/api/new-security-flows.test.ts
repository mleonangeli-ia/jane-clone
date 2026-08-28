/**
 * HTTP regressions for the security-sensitive flows added in this session.
 * Uses the running app when available; pure logic remains covered in tests/lib.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3001";

async function serverAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE}/api/auth/csrf`, {
      signal: AbortSignal.timeout(2_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

describe("new public-flow security regressions", () => {
  it("reaches checkout without a dashboard session but does not expose an unknown appointment", async (t) => {
    if (!(await serverAvailable())) {
      t.skip("development server is not running");
      return;
    }

    const response = await fetch(`${BASE}/api/payments/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId: "appointment-that-does-not-exist" }),
    });
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: "Turno no encontrado" });
  });

  it("rejects checkout for an existing-looking appointment without its access cookie", async (t) => {
    if (!(await serverAvailable())) {
      t.skip("development server is not running");
      return;
    }

    const response = await fetch(`${BASE}/api/payments/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId: "cm1234567890existinglooking" }),
    });
    assert.ok([403, 404].includes(response.status));
    assert.notEqual(response.status, 401, "the public checkout must not require a dashboard session");
  });

  it("shows only the generic confirmation error without an appointment access cookie", async (t) => {
    if (!(await serverAvailable())) {
      t.skip("development server is not running");
      return;
    }

    const response = await fetch(
      `${BASE}/book/florencia-lucchini/success?appointment_id=appointment-that-does-not-exist`,
    );
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /No se pudo verificar el turno/);
    assert.doesNotMatch(html, /Confirmación enviada a/);
  });

  it("fails closed for an unsigned MercadoPago payment event", async (t) => {
    if (!(await serverAvailable())) {
      t.skip("development server is not running");
      return;
    }

    const response = await fetch(`${BASE}/api/payments/webhook?data.id=payment-123`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "payment", data: { id: "payment-123" } }),
    });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: "Invalid signature" });
  });
});
