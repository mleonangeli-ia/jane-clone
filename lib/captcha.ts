import { validateProof } from "@/lib/captcha/proof";

/**
 * Verifies a captcha proof token (AES-256-GCM signed, issued by /api/captcha/*).
 * Replaces Cloudflare Turnstile — no external dependency, self-hosted.
 *
 * Returns true if the proof is cryptographically valid and not expired (5 min TTL).
 * Missing or invalid configuration fails closed.
 */
export async function verifyCaptchaToken(proofToken: string, _ip?: string): Promise<boolean> {
  // Empty token = captcha not yet solved
  if (!proofToken) return false;

  return validateProof(proofToken);
}
