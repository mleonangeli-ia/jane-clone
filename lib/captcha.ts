import { validateProof } from "@/lib/captcha/puzzle";

/**
 * Verifies a captcha proof token (AES-256-GCM signed, issued by /api/captcha/*).
 * Replaces Cloudflare Turnstile — no external dependency, self-hosted.
 *
 * Returns true if the proof is cryptographically valid and not expired (5 min TTL).
 * If CAPTCHA_SECRET is not configured, always returns true (dev / test mode).
 */
export async function verifyCaptchaToken(proofToken: string, _ip?: string): Promise<boolean> {
  // Dev/test bypass — no secret configured
  if (!process.env.CAPTCHA_SECRET) return true;

  // Empty token = captcha not yet solved
  if (!proofToken) return false;

  return validateProof(proofToken);
}
