import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import type * as RateLimitModule from "@/lib/rate-limit";

const key = `test:postgres:${randomUUID()}`;
let rateLimit: typeof RateLimitModule;

before(async () => {
  config({ path: ".env", quiet: true });
  config({ path: ".env.local", override: true, quiet: true });
  rateLimit = await import("@/lib/rate-limit");
});

after(async () => {
  await rateLimit.reset(key);
  const { prisma } = await import("@/lib/db");
  await prisma.$disconnect();
});

describe("PostgreSQL rate limit store", () => {
  it("enforces one limit atomically across concurrent consumers", async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }, () => rateLimit.consume(key, 5, 60_000)),
    );

    assert.equal(results.filter((result) => result.allowed).length, 5);
    assert.equal(results.filter((result) => !result.allowed).length, 15);
    assert.equal((await rateLimit.peek(key, 5, 60_000)).remaining, 0);
  });
});
