import { createHash } from "node:crypto";
import { getValidProof } from "@/lib/captcha/proof";
import {
  postgresCaptchaProofStore,
  type CaptchaProofStore,
} from "@/lib/captcha/proof-store";

/**
 * Verifies a captcha proof token (AES-256-GCM signed, issued by /api/captcha/*).
 * Replaces Cloudflare Turnstile — no external dependency, self-hosted.
 *
 * Returns true if the proof is valid, not expired and has not been used before.
 * Missing or invalid configuration fails closed.
 */
export async function verifyCaptchaToken(
  proofToken: string,
  _ip?: string,
  store: CaptchaProofStore = postgresCaptchaProofStore,
): Promise<boolean> {
  // Empty token = captcha not yet solved
  if (!proofToken) return false;

  const now = Date.now();
  const proof = getValidProof(proofToken, now);
  if (!proof) return false;

  const key = createHash("sha256").update(proofToken, "utf8").digest("hex");
  return store.consume(key, proof.expiresAt, new Date(now));
}
