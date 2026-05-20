import { describe, it, expect, beforeEach, vi } from "vitest";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// The rate-limit module uses a module-level Map. We need to isolate tests
// by using a short window and letting time advance, or by reimporting.
// We use vi.useFakeTimers to control time.

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("allows requests under the limit", () => {
    const ip = `test-ip-${Math.random()}`;
    for (let i = 0; i < 15; i++) {
      expect(rateLimit(ip, 15, 60_000)).toBe(true);
    }
  });

  it("blocks the request that exceeds the limit", () => {
    const ip = `test-ip-${Math.random()}`;
    for (let i = 0; i < 15; i++) rateLimit(ip, 15, 60_000);
    expect(rateLimit(ip, 15, 60_000)).toBe(false);
  });

  it("resets after the window expires", () => {
    const ip = `test-ip-${Math.random()}`;
    for (let i = 0; i < 15; i++) rateLimit(ip, 15, 60_000);
    expect(rateLimit(ip, 15, 60_000)).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(61_000);
    expect(rateLimit(ip, 15, 60_000)).toBe(true);
  });

  it("tracks IPs independently", () => {
    const ip1 = `test-ip-${Math.random()}`;
    const ip2 = `test-ip-${Math.random()}`;

    for (let i = 0; i < 15; i++) rateLimit(ip1, 15, 60_000);
    expect(rateLimit(ip1, 15, 60_000)).toBe(false);
    expect(rateLimit(ip2, 15, 60_000)).toBe(true);
  });
});

describe("getClientIp", () => {
  it("extracts the first IP from x-forwarded-for", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("returns 'unknown' when header is missing", () => {
    const req = new Request("http://localhost");
    expect(getClientIp(req)).toBe("unknown");
  });

  it("handles single IP without comma", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "9.9.9.9" },
    });
    expect(getClientIp(req)).toBe("9.9.9.9");
  });
});
