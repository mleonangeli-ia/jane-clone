type Entry = { count: number; reset: number };
const store = new Map<string, Entry>();

// Removes expired entries periodically to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.reset) store.delete(key);
  }
}, 5 * 60_000);

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

/** Resets the counter for a key (e.g. after successful login). */
export function reset(key: string) {
  store.delete(key);
}

/** Legacy helper kept for existing call sites. */
export function rateLimit(key: string, limit = 15, windowMs = 60_000): boolean {
  return consume(key, limit, windowMs).allowed;
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}
