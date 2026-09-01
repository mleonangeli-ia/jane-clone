import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { config } from "dotenv";
import type * as CaptchaModule from "@/lib/captcha";
import type * as ProofModule from "@/lib/captcha/proof";

const TEST_SECRET = "captcha-postgres-test-secret-at-least-32-characters";
let captcha: typeof CaptchaModule;
let proofModule: typeof ProofModule;
let proof = "";
let key = "";

before(async () => {
  config({ path: ".env", quiet: true });
  config({ path: ".env.local", override: true, quiet: true });
  process.env.CAPTCHA_SECRET = TEST_SECRET;

  const tokenModule = await import("@/lib/captcha/token");
  tokenModule._resetKeyForTesting();
  captcha = await import("@/lib/captcha");
  proofModule = await import("@/lib/captcha/proof");
  proof = proofModule.createProof("puzzle", Date.now() - 3_000);
  key = createHash("sha256").update(proof, "utf8").digest("hex");

  const { prisma } = await import("@/lib/db");
  await prisma.$executeRaw`DELETE FROM "captcha_proof_uses" WHERE "key" = ${key}`;
});

after(async () => {
  const { prisma } = await import("@/lib/db");
  await prisma.$executeRaw`DELETE FROM "captcha_proof_uses" WHERE "key" = ${key}`;
  await prisma.$disconnect();
});

describe("PostgreSQL CAPTCHA proof store", () => {
  it("allows exactly one consumer across concurrent requests", async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }, () => captcha.verifyCaptchaToken(proof)),
    );

    assert.equal(results.filter(Boolean).length, 1);
    assert.equal(results.filter((accepted) => !accepted).length, 19);
  });
});
