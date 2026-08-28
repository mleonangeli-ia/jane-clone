import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  APPOINTMENT_ACCESS_TTL_SECONDS,
  appointmentAccessCookieOptions,
  createAppointmentAccessToken,
  verifyAppointmentAccessToken,
} from "../../lib/appointment-access-token";

const originalSecret = process.env.NEXTAUTH_SECRET;
const now = Date.parse("2026-08-27T12:00:00Z");

before(() => {
  process.env.NEXTAUTH_SECRET = "test-secret-with-at-least-16-characters";
});

after(() => {
  if (originalSecret === undefined) delete process.env.NEXTAUTH_SECRET;
  else process.env.NEXTAUTH_SECRET = originalSecret;
});

describe("appointment access token", () => {
  it("authorizes the matching appointment before expiration", () => {
    const token = createAppointmentAccessToken("appointment-1", now);
    assert.equal(verifyAppointmentAccessToken(token, "appointment-1", now), true);
  });

  it("rejects a token used for another appointment", () => {
    const token = createAppointmentAccessToken("appointment-1", now);
    assert.equal(verifyAppointmentAccessToken(token, "appointment-2", now), false);
  });

  it("rejects expired and tampered tokens", () => {
    const token = createAppointmentAccessToken("appointment-1", now);
    const expiredAt = now + APPOINTMENT_ACCESS_TTL_SECONDS * 1000;
    const tampered = `${token.slice(0, -1)}${token.endsWith("0") ? "1" : "0"}`;
    assert.equal(verifyAppointmentAccessToken(token, "appointment-1", expiredAt), false);
    assert.equal(verifyAppointmentAccessToken(tampered, "appointment-1", now), false);
  });

  it("rejects malformed tokens", () => {
    assert.equal(verifyAppointmentAccessToken(undefined, "appointment-1", now), false);
    assert.equal(verifyAppointmentAccessToken("invalid", "appointment-1", now), false);
    assert.equal(verifyAppointmentAccessToken(`${now + 1}.abc`, "appointment-1", now), false);
  });

  it("rejects a token exactly at its expiration boundary", () => {
    const token = createAppointmentAccessToken("appointment-1", now);
    const expiresAt = now + APPOINTMENT_ACCESS_TTL_SECONDS * 1000;
    assert.equal(verifyAppointmentAccessToken(token, "appointment-1", expiresAt - 1), true);
    assert.equal(verifyAppointmentAccessToken(token, "appointment-1", expiresAt), false);
  });

  it("rejects empty appointment identifiers", () => {
    assert.throws(() => createAppointmentAccessToken("", now), /appointmentId is required/);
    const token = createAppointmentAccessToken("appointment-1", now);
    assert.equal(verifyAppointmentAccessToken(token, "", now), false);
  });

  it("fails closed during verification when the secret is missing or too short", () => {
    const token = createAppointmentAccessToken("appointment-1", now);
    delete process.env.NEXTAUTH_SECRET;
    assert.equal(verifyAppointmentAccessToken(token, "appointment-1", now), false);
    process.env.NEXTAUTH_SECRET = "short";
    assert.equal(verifyAppointmentAccessToken(token, "appointment-1", now), false);
    process.env.NEXTAUTH_SECRET = "test-secret-with-at-least-16-characters";
  });

  it("refuses to create credentials without a sufficiently strong configured secret", () => {
    delete process.env.NEXTAUTH_SECRET;
    assert.throws(
      () => createAppointmentAccessToken("appointment-1", now),
      /NEXTAUTH_SECRET must be configured/,
    );
    process.env.NEXTAUTH_SECRET = "test-secret-with-at-least-16-characters";
  });
});

describe("appointment access cookie", () => {
  it("is HttpOnly, same-site, path-scoped and expires with the credential", () => {
    assert.deepEqual(appointmentAccessCookieOptions("development"), {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: APPOINTMENT_ACCESS_TTL_SECONDS,
    });
  });

  it("is Secure in production", () => {
    assert.equal(appointmentAccessCookieOptions("production").secure, true);
  });
});
