import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { generateMeetingUrl } from "@/lib/meeting";

describe("generateMeetingUrl", () => {
  let originalSecret: string | undefined;

  before(() => {
    originalSecret = process.env.NEXTAUTH_SECRET;
    process.env.NEXTAUTH_SECRET = "test-secret-for-unit-tests";
  });

  after(() => {
    process.env.NEXTAUTH_SECRET = originalSecret;
  });

  it("returns a valid Jitsi URL", () => {
    const url = generateMeetingUrl("appointment-123");
    assert.ok(url.startsWith("https://meet.jit.si/jc-"), `expected jitsi URL, got ${url}`);
  });

  it("returns deterministic URL for same appointmentId", () => {
    const url1 = generateMeetingUrl("appt-abc");
    const url2 = generateMeetingUrl("appt-abc");
    assert.strictEqual(url1, url2);
  });

  it("returns different URL for different appointmentIds", () => {
    const url1 = generateMeetingUrl("appt-001");
    const url2 = generateMeetingUrl("appt-002");
    assert.notStrictEqual(url1, url2);
  });

  it("room name is 12 hex chars after 'jc-'", () => {
    const url = generateMeetingUrl("appt-xyz");
    const room = url.replace("https://meet.jit.si/jc-", "");
    assert.strictEqual(room.length, 12);
    assert.match(room, /^[0-9a-f]+$/);
  });

  it("URL only contains URL-safe characters", () => {
    const url = generateMeetingUrl("appt-special-!@#");
    assert.match(url, /^https:\/\/meet\.jit\.si\/jc-[0-9a-f]+$/);
  });

  it("different secrets produce different URLs for same appointmentId", () => {
    process.env.NEXTAUTH_SECRET = "test-secret-for-unit-tests";
    const url1 = generateMeetingUrl("appt-same");
    process.env.NEXTAUTH_SECRET = "completely-different-secret-here";
    const url2 = generateMeetingUrl("appt-same");
    assert.notStrictEqual(url1, url2);
    process.env.NEXTAUTH_SECRET = "test-secret-for-unit-tests";
  });

  it("throws when NEXTAUTH_SECRET is missing or too short", () => {
    const original = process.env.NEXTAUTH_SECRET;
    process.env.NEXTAUTH_SECRET = "short";
    assert.throws(() => generateMeetingUrl("appt-1"), /NEXTAUTH_SECRET/);
    process.env.NEXTAUTH_SECRET = original;
  });

  it("throws with helpful message when NEXTAUTH_SECRET is undefined", () => {
    const original = process.env.NEXTAUTH_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    assert.throws(() => generateMeetingUrl("appt-1"), /NEXTAUTH_SECRET/);
    process.env.NEXTAUTH_SECRET = original;
  });

  it("URL is exactly the expected length (base URL + 'jc-' + 12 chars)", () => {
    const url = generateMeetingUrl("any-id");
    const expectedLength = "https://meet.jit.si/jc-".length + 12;
    assert.strictEqual(url.length, expectedLength);
  });
});
