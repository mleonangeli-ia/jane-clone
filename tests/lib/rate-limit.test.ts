import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    mock.timers.enable(["Date"]);
  });

  afterEach(() => {
    mock.timers.reset();
  });

  it("allows requests up to the limit", () => {
    const ip = `ip-${Math.random()}`;
    for (let i = 0; i < 15; i++) {
      assert.strictEqual(rateLimit(ip, 15, 60_000), true);
    }
  });

  it("blocks the request that exceeds the limit", () => {
    const ip = `ip-${Math.random()}`;
    for (let i = 0; i < 15; i++) rateLimit(ip, 15, 60_000);
    assert.strictEqual(rateLimit(ip, 15, 60_000), false);
  });

  it("resets after the window expires", () => {
    const ip = `ip-${Math.random()}`;
    for (let i = 0; i < 15; i++) rateLimit(ip, 15, 60_000);
    assert.strictEqual(rateLimit(ip, 15, 60_000), false);
    mock.timers.tick(61_000);
    assert.strictEqual(rateLimit(ip, 15, 60_000), true);
  });

  it("tracks IPs independently", () => {
    const ip1 = `ip-${Math.random()}`;
    const ip2 = `ip-${Math.random()}`;
    for (let i = 0; i < 15; i++) rateLimit(ip1, 15, 60_000);
    assert.strictEqual(rateLimit(ip1, 15, 60_000), false);
    assert.strictEqual(rateLimit(ip2, 15, 60_000), true);
  });
});

describe("getClientIp", () => {
  it("extracts the first IP from x-forwarded-for", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    assert.strictEqual(getClientIp(req), "1.2.3.4");
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
