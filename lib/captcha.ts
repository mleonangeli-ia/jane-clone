const TURNSTILE_VERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Verifies a Cloudflare Turnstile token server-side.
 * Returns true if valid. If TURNSTILE_SECRET_KEY is not configured,
 * always returns true (dev / test mode).
 */
export async function verifyCaptchaToken(token: string, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // No key → dev/test bypass
  if (!secret || secret.startsWith("1x0000")) return true;

  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.append("remoteip", ip);

  try {
    const res = await fetch(TURNSTILE_VERIFY, { method: "POST", body });
    const data = (await res.json()) as { success: boolean };
    return data.success;
  } catch {
    return false;
  }
}
