import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateEnvironment } from "@/lib/env-schema";

const baseEnvironment: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://user:password@localhost:5432/jane",
  NEXTAUTH_SECRET: "nextauth-secret-with-at-least-32-characters",
  NEXTAUTH_URL: "http://localhost:3000",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  CAPTCHA_SECRET: "captcha-secret-with-at-least-32-characters",
  PAYMENTS_ENABLED: "false",
};

function productionEnvironment(): NodeJS.ProcessEnv {
  return {
    ...baseEnvironment,
    NODE_ENV: "production",
    NEXTAUTH_URL: "https://jane.example.com",
    NEXT_PUBLIC_APP_URL: "https://jane.example.com",
    RESEND_API_KEY: "re_production_key",
    FROM_EMAIL: "Turnos <turnos@example.com>",
    CRON_SECRET: "cron-secret-with-at-least-32-characters",
    VAPID_PUBLIC_KEY: "configured-public-key",
    VAPID_PRIVATE_KEY: "configured-private-key",
    VAPID_SUBJECT: "mailto:notifications@example.com",
  };
}

function issuePaths(result: ReturnType<typeof validateEnvironment>): string[] {
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
}

describe("environment configuration", () => {
  it("accepts a minimal non-production configuration", () => {
    assert.equal(validateEnvironment(baseEnvironment).success, true);
  });

  it("requires operational credentials in production", () => {
    const result = validateEnvironment({ ...baseEnvironment, NODE_ENV: "production" });
    assert.equal(result.success, false);
    const paths = issuePaths(result);
    for (const name of [
      "RESEND_API_KEY",
      "FROM_EMAIL",
      "CRON_SECRET",
      "VAPID_PUBLIC_KEY",
      "VAPID_PRIVATE_KEY",
      "VAPID_SUBJECT",
    ]) {
      assert.ok(paths.includes(name), `${name} should be required`);
    }
  });

  it("requires Mercado Pago credentials only when payments are enabled", () => {
    const enabled = productionEnvironment();
    enabled.PAYMENTS_ENABLED = "true";
    const result = validateEnvironment(enabled);
    assert.equal(result.success, false);
    assert.ok(issuePaths(result).includes("MP_ACCESS_TOKEN"));
    assert.ok(issuePaths(result).includes("MP_WEBHOOK_SECRET"));

    assert.equal(validateEnvironment(productionEnvironment()).success, true);
  });

  it("requires HTTPS application URLs in production", () => {
    const environment = productionEnvironment();
    environment.NEXTAUTH_URL = "http://jane.example.com";
    environment.NEXT_PUBLIC_APP_URL = "http://jane.example.com";
    const result = validateEnvironment(environment);
    assert.deepEqual(
      issuePaths(result).filter((path) => path.includes("URL")).sort(),
      ["NEXTAUTH_URL", "NEXT_PUBLIC_APP_URL"].sort(),
    );
  });

  it("requires Google OAuth credentials to be configured as a pair", () => {
    const environment = { ...baseEnvironment, GOOGLE_CLIENT_ID: "client-id" };
    const result = validateEnvironment(environment);
    assert.equal(result.success, false);
    assert.ok(issuePaths(result).includes("GOOGLE_CLIENT_SECRET"));
  });

  it("rejects weak application secrets", () => {
    const result = validateEnvironment({
      ...baseEnvironment,
      NEXTAUTH_SECRET: "too-short",
      CAPTCHA_SECRET: "too-short",
    });
    assert.equal(result.success, false);
    assert.ok(issuePaths(result).includes("NEXTAUTH_SECRET"));
    assert.ok(issuePaths(result).includes("CAPTCHA_SECRET"));
  });
});
