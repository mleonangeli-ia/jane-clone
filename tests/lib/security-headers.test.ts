import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildContentSecurityPolicy } from "@/lib/security-headers";

describe("Content Security Policy", () => {
  it("allows eval only in development for React debugging", () => {
    const policy = buildContentSecurityPolicy("development");
    assert.match(policy, /script-src[^;]*'unsafe-eval'/);
  });

  for (const environment of ["production", "test", undefined]) {
    it(`does not allow eval in ${environment ?? "an unspecified environment"}`, () => {
      const policy = buildContentSecurityPolicy(environment);
      assert.doesNotMatch(policy, /'unsafe-eval'/);
    });
  }

  it("retains the Turnstile and same-origin directives", () => {
    const policy = buildContentSecurityPolicy("production");
    assert.match(policy, /default-src 'self'/);
    assert.match(policy, /frame-src https:\/\/challenges\.cloudflare\.com/);
    assert.match(policy, /connect-src 'self' https:\/\/challenges\.cloudflare\.com/);
  });
});
