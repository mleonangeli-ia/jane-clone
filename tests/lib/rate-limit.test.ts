import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { randomUUID } from "node:crypto";
import { MemoryRateLimitStore } from "@/tests/helpers/rate-limit-store";

describe("rateLimit", () => {
  beforeEach(() => {
    mock.timers.enable(["Date"]);
  });

  afterEach(() => {
    mock.timers.reset();
  });

  it("allows requests up to the limit", async () => {
    const store = new MemoryRateLimitStore();
    const ip = `ip-${randomUUID()}`;
    for (let i = 0; i < 15; i++) {
      assert.strictEqual(await rateLimit(ip, 15, 60_000, store), true);
    }
  });

  it("blocks the request that exceeds the limit", async () => {
    const store = new MemoryRateLimitStore();
    const ip = `ip-${randomUUID()}`;
    for (let i = 0; i < 15; i++) await rateLimit(ip, 15, 60_000, store);
    assert.strictEqual(await rateLimit(ip, 15, 60_000, store), false);
  });

  it("resets after the window expires", async () => {
    const store = new MemoryRateLimitStore();
    const ip = `ip-${randomUUID()}`;
    for (let i = 0; i < 15; i++) await rateLimit(ip, 15, 60_000, store);
    assert.strictEqual(await rateLimit(ip, 15, 60_000, store), false);
    mock.timers.tick(61_000);
    assert.strictEqual(await rateLimit(ip, 15, 60_000, store), true);
  });

  it("tracks IPs independently", async () => {
    const store = new MemoryRateLimitStore();
    const ip1 = `ip-${randomUUID()}`;
    const ip2 = `ip-${randomUUID()}`;
    for (let i = 0; i < 15; i++) await rateLimit(ip1, 15, 60_000, store);
    assert.strictEqual(await rateLimit(ip1, 15, 60_000, store), false);
    assert.strictEqual(await rateLimit(ip2, 15, 60_000, store), true);
  });

  it("shares one atomic limit across concurrent consumers", async () => {
    const store = new MemoryRateLimitStore();
    const results = await Promise.all(
      Array.from({ length: 25 }, () => rateLimit("shared-key", 10, 60_000, store)),
    );
    assert.equal(results.filter(Boolean).length, 10);
  });
});

describe("getClientIp", () => {
  // Security note: we take the LAST entry of x-forwarded-for (injected by
  // the outermost proxy) so attackers can't spoof it by prepending fake IPs.
  it("extracts the last (outermost-proxy) IP from x-forwarded-for", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    assert.strictEqual(getClientIp(req), "5.6.7.8");
  });

  it("returns 'unknown' when header is missing", () => {
    const req = new Request("http://localhost");
    assert.strictEqual(getClientIp(req), "unknown");
  });

  it("handles a single IP without comma", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "9.9.9.9" },
    });
    assert.strictEqual(getClientIp(req), "9.9.9.9");
  });
});
