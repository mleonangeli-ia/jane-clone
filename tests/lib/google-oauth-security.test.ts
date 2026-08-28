import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  createGoogleOAuthSecurityParams,
  getGoogleRefreshToken,
  GOOGLE_OAUTH_COOKIE_TTL_SECONDS,
  googleOAuthCookieOptions,
  googleOAuthStateMatches,
} from "@/lib/google-oauth-security";

describe("Google OAuth state and PKCE", () => {
  it("generates base64url state and verifier with sufficient entropy", () => {
    const params = createGoogleOAuthSecurityParams();
    assert.match(params.state, /^[A-Za-z0-9_-]{43}$/);
    assert.match(params.codeVerifier, /^[A-Za-z0-9_-]{86}$/);
  });

  it("derives an S256 challenge from the verifier", () => {
    const params = createGoogleOAuthSecurityParams();
    const expected = createHash("sha256").update(params.codeVerifier).digest("base64url");
    assert.equal(params.codeChallenge, expected);
    assert.match(params.codeChallenge, /^[A-Za-z0-9_-]{43}$/);
  });

  it("generates independent values for separate authorization attempts", () => {
    const first = createGoogleOAuthSecurityParams();
    const second = createGoogleOAuthSecurityParams();
    assert.notEqual(first.state, second.state);
    assert.notEqual(first.codeVerifier, second.codeVerifier);
    assert.notEqual(first.codeChallenge, second.codeChallenge);
  });

  it("accepts an exact state match", () => {
    assert.equal(googleOAuthStateMatches("expected-state", "expected-state"), true);
  });

  it("rejects missing, different, and different-length state", () => {
    assert.equal(googleOAuthStateMatches(null, "expected-state"), false);
    assert.equal(googleOAuthStateMatches("expected-state", undefined), false);
    assert.equal(googleOAuthStateMatches("attacker-state", "expected-state"), false);
    assert.equal(googleOAuthStateMatches("short", "expected-state"), false);
  });
});

describe("Google OAuth callback inputs", () => {
  it("accepts only a non-empty string refresh token", () => {
    assert.equal(getGoogleRefreshToken({ refresh_token: "refresh-123" }), "refresh-123");
    assert.equal(getGoogleRefreshToken({ refresh_token: "" }), null);
    assert.equal(getGoogleRefreshToken({ refresh_token: 123 }), null);
    assert.equal(getGoogleRefreshToken({ access_token: "access-only" }), null);
    assert.equal(getGoogleRefreshToken(null), null);
  });

  it("uses short-lived HttpOnly callback cookies", () => {
    assert.deepEqual(googleOAuthCookieOptions("development"), {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/api/google-calendar/callback",
      maxAge: GOOGLE_OAUTH_COOKIE_TTL_SECONDS,
    });
  });

  it("marks cookies Secure in production and supports immediate expiration", () => {
    const options = googleOAuthCookieOptions("production", 0);
    assert.equal(options.secure, true);
    assert.equal(options.maxAge, 0);
  });
});
