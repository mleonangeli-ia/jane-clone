import crypto from "crypto";

const JITSI_BASE = "https://meet.jit.si";

/**
 * Generates a hard-to-guess Jitsi Meet room URL for an appointment.
 * Room name: jc-<12 random chars> — unpredictable but stable for the same appointmentId.
 */
export function generateMeetingUrl(appointmentId: string): string {
  const hash = crypto
    .createHmac("sha256", process.env.NEXTAUTH_SECRET ?? "fallback")
    .update(appointmentId)
    .digest("hex")
    .slice(0, 12);
  return `${JITSI_BASE}/jc-${hash}`;
}
