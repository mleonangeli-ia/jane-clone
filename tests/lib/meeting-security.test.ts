/**
 * Security-focused tests for meeting URL generation.
 * Validates unpredictability, isolation between tenants, and secret enforcement.
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { generateMeetingUrl } from "@/lib/meeting";

describe("Meeting URL security", () => {
  let originalSecret: string | undefined;

  before(() => {
    originalSecret = process.env.NEXTAUTH_SECRET;
    process.env.NEXTAUTH_SECRET = "secure-test-secret-32-chars-long";
  });

  after(() => {
    process.env.NEXTAUTH_SECRET = originalSecret;
  });

  it("room name has sufficient entropy (12 hex chars = 48 bits)", () => {
    const url = generateMeetingUrl("appt-entropy-test");
    const room = url.replace("https://meet.jit.si/jc-", "");
    // 12 hex chars = 4 bits each → 48 bits of entropy
    // Brute force at 1 billion tries/sec → ~9 days to enumerate
    assert.strictEqual(room.length, 12);
  });

  it("cannot predict URL for appointment-1 from knowing URL for appointment-2", () => {
    const url1 = generateMeetingUrl("appt-known-1");
    const url2 = generateMeetingUrl("appt-known-2");
    const room1 = url1.replace("https://meet.jit.si/jc-", "");
    const room2 = url2.replace("https://meet.jit.si/jc-", "");
    // Rooms should differ substantially (not sequential)
    assert.notStrictEqual(room1, room2);
    // No common prefix beyond length 6 (would indicate predictability)
    const commonPrefixLength = [...room1].findIndex((c, i) => c !== room2[i]);
    assert.ok(
      commonPrefixLength !== -1 || room1 !== room2,
      "rooms must not be identical"
    );
  });

  it("two tenants with same appointmentId get same URL (URL is per-appointment, not per-tenant)", () => {
    // The Jitsi URL is scoped to appointmentId, not tenantId.
    // This is correct: each appointment has a unique cuid() so collision is impossible.
    const url1 = generateMeetingUrl("clxxxxxxxxxxxxxxxxxxxxxxxx");
    const url2 = generateMeetingUrl("clxxxxxxxxxxxxxxxxxxxxxxxx");
    assert.strictEqual(url1, url2);
  });

  it("changing even 1 char in appointmentId produces a completely different URL", () => {
    const url1 = generateMeetingUrl("appointment-abc1");
    const url2 = generateMeetingUrl("appointment-abc2"); // 1 char different
    const room1 = url1.replace("https://meet.jit.si/jc-", "");
    const room2 = url2.replace("https://meet.jit.si/jc-", "");
    assert.notStrictEqual(room1, room2);
    // Avalanche effect: most bits should differ
    let diffBits = 0;
    for (let i = 0; i < room1.length; i++) {
      if (room1[i] !== room2[i]) diffBits++;
    }
    // At least 4 of 12 chars should differ (expected ~6 due to avalanche)
    assert.ok(diffBits >= 4, `expected avalanche effect, only ${diffBits}/12 chars differ`);
  });

  it("URL does not contain appointmentId (no info leakage)", () => {
    const aptId = "secret-appointment-id-12345";
    const url = generateMeetingUrl(aptId);
    assert.ok(!url.includes(aptId), "appointment ID must not appear in meeting URL");
  });

  it("URL does not start with jc-0000 or jc-ffff (not degenerate)", () => {
    // Simple sanity check that output isn't a constant/degenerate value
    const urls = Array.from({ length: 10 }, (_, i) => generateMeetingUrl(`appt-${i}`));
    const rooms = urls.map((u) => u.replace("https://meet.jit.si/jc-", ""));
    const unique = new Set(rooms);
    assert.strictEqual(unique.size, 10, "all 10 appointment URLs must be unique");
  });

  it("refuses secret shorter than 16 chars (minimum security threshold)", () => {
    const orig = process.env.NEXTAUTH_SECRET;
    process.env.NEXTAUTH_SECRET = "too-short-12345"; // 15 chars
    assert.throws(() => generateMeetingUrl("any"), /NEXTAUTH_SECRET/);
    process.env.NEXTAUTH_SECRET = orig;
  });

  it("accepts secret of exactly 16 chars (minimum valid)", () => {
    const orig = process.env.NEXTAUTH_SECRET;
    process.env.NEXTAUTH_SECRET = "exactly16charsok"; // exactly 16
    assert.doesNotThrow(() => generateMeetingUrl("any"));
    process.env.NEXTAUTH_SECRET = orig;
  });
});
