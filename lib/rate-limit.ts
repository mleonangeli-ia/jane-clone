import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";

const MAX_KEY_LENGTH = 512;
const MAX_LIMIT = 1_000_000;
const MAX_WINDOW_MS = 30 * 24 * 60 * 60_000;

type StoredBucket = { count: number; resetAt: Date };

export interface RateLimitStore {
  consume(key: string, limit: number, windowMs: number): Promise<StoredBucket>;
  peek(key: string): Promise<StoredBucket | null>;
  reset(key: string): Promise<void>;
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
};

const postgresRateLimitStore: RateLimitStore = {
  async consume(key, limit, windowMs) {
    const now = new Date();
    const nextResetAt = new Date(now.getTime() + windowMs);
    const rows = await prisma.$queryRaw<StoredBucket[]>`
      WITH "expired" AS (
        SELECT "key" FROM "rate_limit_buckets"
        WHERE "resetAt" <= ${now}
        LIMIT 100
      ),
      "cleanup" AS (
        DELETE FROM "rate_limit_buckets"
        USING "expired"
        WHERE "rate_limit_buckets"."key" = "expired"."key"
      )
      INSERT INTO "rate_limit_buckets" ("key", "count", "resetAt", "updatedAt")
      VALUES (${key}, 1, ${nextResetAt}, ${now})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "rate_limit_buckets"."resetAt" <= ${now} THEN 1
          ELSE LEAST("rate_limit_buckets"."count" + 1, ${limit + 1})
        END,
        "resetAt" = CASE
          WHEN "rate_limit_buckets"."resetAt" <= ${now} THEN ${nextResetAt}
          ELSE "rate_limit_buckets"."resetAt"
        END,
        "updatedAt" = ${now}
      RETURNING "count", "resetAt"
    `;

    const bucket = rows[0];
    if (!bucket) throw new Error("Rate limit storage did not return a bucket");
    return bucket;
  },

  async peek(key) {
    const now = new Date();
    const rows = await prisma.$queryRaw<StoredBucket[]>`
      SELECT "count", "resetAt"
      FROM "rate_limit_buckets"
      WHERE "key" = ${key} AND "resetAt" > ${now}
      LIMIT 1
    `;
    return rows[0] ?? null;
  },

  async reset(key) {
    await prisma.$executeRaw`
      DELETE FROM "rate_limit_buckets" WHERE "key" = ${key}
    `;
  },
};

function validateArguments(key: string, limit: number, windowMs: number): void {
  if (!key || key.length > MAX_KEY_LENGTH) throw new Error("Invalid rate limit key");
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new Error("Invalid rate limit limit");
  }
  if (!Number.isInteger(windowMs) || windowMs < 1 || windowMs > MAX_WINDOW_MS) {
    throw new Error("Invalid rate limit window");
  }
}

function storageKey(key: string): string {
  return createHash("sha256").update(key, "utf8").digest("hex");
}

function resultFor(bucket: StoredBucket, limit: number): RateLimitResult {
  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    resetInMs: Math.max(0, bucket.resetAt.getTime() - Date.now()),
  };
}

/** Atomically consumes one attempt in the shared PostgreSQL bucket. */
export async function consume(
  key: string,
  limit: number,
  windowMs: number,
  store: RateLimitStore = postgresRateLimitStore,
): Promise<RateLimitResult> {
  validateArguments(key, limit, windowMs);
  return resultFor(await store.consume(storageKey(key), limit, windowMs), limit);
}

/** Reads a bucket without consuming an attempt. */
export async function peek(
  key: string,
  limit: number,
  windowMs: number,
  store: RateLimitStore = postgresRateLimitStore,
): Promise<RateLimitResult> {
  validateArguments(key, limit, windowMs);
  const bucket = await store.peek(storageKey(key));
  if (!bucket || bucket.resetAt.getTime() <= Date.now()) {
    return { allowed: true, remaining: limit, resetInMs: windowMs };
  }
  return resultFor(bucket, limit);
}

export async function reset(
  key: string,
  store: RateLimitStore = postgresRateLimitStore,
): Promise<void> {
  if (!key || key.length > MAX_KEY_LENGTH) throw new Error("Invalid rate limit key");
  await store.reset(storageKey(key));
}

export async function rateLimit(
  key: string,
  limit = 15,
  windowMs = 60_000,
  store: RateLimitStore = postgresRateLimitStore,
): Promise<boolean> {
  return (await consume(key, limit, windowMs, store)).allowed;
}

/** Returns the address added by the outermost reverse proxy. */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (!forwarded) return "unknown";
  const addresses = forwarded.split(",").map((address) => address.trim()).filter(Boolean);
  return addresses.at(-1) ?? "unknown";
}
