import { consume, type RateLimitResult } from "./rate-limit";

// ── Disposable / temporary email domains ──────────────────────────────────────
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "tempmail.com", "throwaway.email",
  "fakeinbox.com", "maildrop.cc", "yopmail.com", "sharklasers.com",
  "guerrillamail.info", "guerrillamail.biz", "guerrillamail.de",
  "guerrillamail.net", "guerrillamail.org", "spam4.me", "trashmail.com",
  "trashmail.me", "trashmail.at", "trashmail.io", "dispostable.com",
  "mailnull.com", "spamgourmet.com", "tmpmail.org", "throwam.com",
  "mailnesia.com", "getairmail.com", "discard.email", "temp-mail.org",
  "spamherelots.com", "tempr.email", "dispostable.com", "nwytg.com",
  "cuvox.de", "fleckens.hu", "dayrep.com", "teleworm.us", "gustr.com",
  "jourrapide.com", "rhyta.com", "superrito.com", "einrot.com",
  "armyspy.com", "cuvox.de", "fleckens.hu",
]);

/**
 * Returns true if the email domain is known to be disposable/temporary.
 */
export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase().trim();
  if (!domain) return false;
  return DISPOSABLE_DOMAINS.has(domain);
}

/**
 * Honeypot check. Returns true if the request appears human (honeypot is empty).
 * Bots typically fill in all form fields, including hidden ones.
 */
export function isHoneypotClean(value: string | null | undefined): boolean {
  return !value || value.trim() === "";
}

// ── Per-endpoint rate limit configs ───────────────────────────────────────────

/** Public booking creation — prevent slot flooding */
export function checkBookingRateLimit(ip: string, email: string): {
  ipResult: RateLimitResult;
  emailResult: RateLimitResult;
} {
  return {
    ipResult:    consume(`booking:ip:${ip}`,       5,  10 * 60_000), // 5/10min per IP
    emailResult: consume(`booking:email:${email}`, 3,  24 * 60 * 60_000), // 3/day per email
  };
}

/** Slot availability check — prevent scraping */
export function checkSlotsRateLimit(ip: string): RateLimitResult {
  return consume(`slots:ip:${ip}`, 60, 60_000); // 60/min per IP
}

/** Waitlist signup — prevent spam */
export function checkWaitlistRateLimit(ip: string): RateLimitResult {
  return consume(`waitlist:ip:${ip}`, 10, 60 * 60_000); // 10/hour per IP
}

/** Public cancel endpoint */
export function checkCancelRateLimit(ip: string): RateLimitResult {
  return consume(`cancel:ip:${ip}`, 5, 60 * 60_000); // 5/hour per IP
}
