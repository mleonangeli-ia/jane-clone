import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { generateMeetingUrl } from "@/lib/meeting";

describe("generateMeetingUrl", () => {
  before(() => {
    process.env.NEXTAUTH_SECRET = "test-secret-for-unit-tests";
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
});
