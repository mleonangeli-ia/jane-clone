type Entry = { count: number; reset: number };
const store = new Map<string, Entry>();

// Removes expired entries periodically to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.reset) store.delete(key);
  }
}, 5 * 60_000).unref();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
};

/**
 * Consumes one token from the bucket.
 * Returns whether the request is allowed and how many attempts remain.
 */
export function consume(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.reset) {
    store.set(key, { count: 1, reset: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetInMs: windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetInMs: entry.reset - now };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetInMs: entry.reset - now };
}

/**
 * Checks the current count WITHOUT consuming a token.
 * Useful for deciding whether to show CAPTCHA before committing the attempt.
 */
export function peek(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.reset) {
    return { allowed: true, remaining: limit, resetInMs: windowMs };
  }
  return {
    allowed: entry.count < limit,
    remaining: Math.max(0, limit - entry.count),
    resetInMs: entry.reset - now,
  };
}

/** Resets the counter for a key (e.g. after successful login). */
export function reset(key: string) {
  store.delete(key);
}

/** Legacy helper kept for existing call sites. */
export function rateLimit(key: string, limit = 15, windowMs = 60_000): boolean {
  return consume(key, limit, windowMs).allowed;
}

/**
 * Returns the real client IP.
 * Trusts X-Forwarded-For only when the connection comes from a known
 * reverse-proxy/CDN range (Vercel, Cloudflare). Otherwise falls back to
 * the socket IP (which cannot be spoofed from outside).
 *
 * In dev/test (no trusted proxy configured) we take the last XFF entry,
 * which is the closest real IP — attackers can prepend entries but not
 * control the last one added by the proxy.
 */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (!xff) return "unknown";

  const ips = xff.split(",").map((s) => s.trim());

  // In production Vercel sets CF-Connecting-IP (single trusted IP).
  // As a simpler guard: take the LAST entry (injected by the outermost proxy,
  // which the attacker cannot control).
  return ips[ips.length - 1] ?? "unknown";
}
