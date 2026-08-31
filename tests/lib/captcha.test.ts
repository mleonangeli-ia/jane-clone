import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { verifyCaptchaToken } from "@/lib/captcha";
import { generateMath, getMathData, verifyMath } from "@/lib/captcha/math";
import {
  CAPTCHA_PROOF_TTL_MS,
  createProof,
  validateProof,
} from "@/lib/captcha/proof";
import { generateText, getTextData, verifyText } from "@/lib/captcha/text";
import { _resetKeyForTesting, encryptToken } from "@/lib/captcha/token";

const TEST_SECRET = "captcha-test-secret-with-at-least-32-characters";

describe("CAPTCHA proof security", () => {
  let originalSecret: string | undefined;

  before(() => {
    originalSecret = process.env.CAPTCHA_SECRET;
  });

  beforeEach(() => {
    process.env.CAPTCHA_SECRET = TEST_SECRET;
    _resetKeyForTesting();
  });

  after(() => {
    if (originalSecret === undefined) delete process.env.CAPTCHA_SECRET;
    else process.env.CAPTCHA_SECRET = originalSecret;
    _resetKeyForTesting();
  });

  it("accepts a valid, recent proof", async () => {
    const proof = createProof("puzzle", Date.now() - 3_000);
    assert.equal(await verifyCaptchaToken(proof, "127.0.0.1"), true);
  });

  it("fails closed when CAPTCHA_SECRET is missing", async () => {
    const proof = createProof("puzzle", Date.now() - 3_000);
    delete process.env.CAPTCHA_SECRET;
    _resetKeyForTesting();
    assert.equal(await verifyCaptchaToken(proof), false);
  });

  it("fails closed when CAPTCHA_SECRET is too short", async () => {
    const proof = createProof("puzzle", Date.now() - 3_000);
    process.env.CAPTCHA_SECRET = "too-short";
    _resetKeyForTesting();
    assert.equal(await verifyCaptchaToken(proof), false);
  });

  it("rejects empty, malformed and tampered proofs", async () => {
    const proof = createProof("puzzle", Date.now() - 3_000);
    const replacement = proof.endsWith("A") ? "B" : "A";
    const tampered = `${proof.slice(0, -1)}${replacement}`;

    assert.equal(await verifyCaptchaToken(""), false);
    assert.equal(await verifyCaptchaToken("not-a-token"), false);
    assert.equal(await verifyCaptchaToken(tampered), false);
  });

  it("rejects expired and future-dated proofs", () => {
    const now = Date.now();
    const expired = encryptToken({
      type: "proof",
      captchaType: "puzzle",
      challengeIssuedAt: now - CAPTCHA_PROOF_TTL_MS - 3_000,
      issuedAt: now - CAPTCHA_PROOF_TTL_MS - 1,
    });
    const future = encryptToken({
      type: "proof",
      captchaType: "puzzle",
      challengeIssuedAt: now,
      issuedAt: now + 1,
    });

    assert.equal(validateProof(expired, now), false);
    assert.equal(validateProof(future, now), false);
  });

  it("issues a proof accepted by the shared validator for math challenges", () => {
    const generated = generateMath();
    const data = getMathData(generated.token);
    assert.ok(data);
    const eligibleToken = encryptToken({ ...data, ts: Date.now() - 2_000 });
    const result = verifyMath(eligibleToken, data.answer);

    assert.equal(result.ok, true);
    assert.ok(result.proof);
    assert.equal(validateProof(result.proof), true);
  });

  it("issues a proof accepted by the shared validator for text challenges", () => {
    const generated = generateText();
    const data = getTextData(generated.token);
    assert.ok(data);
    const eligibleToken = encryptToken({ ...data, ts: Date.now() - 2_000 });
    const result = verifyText(eligibleToken, data.code.toLowerCase());

    assert.equal(result.ok, true);
    assert.ok(result.proof);
    assert.equal(validateProof(result.proof), true);
  });
});
