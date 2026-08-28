import { createHmac, timingSafeEqual } from "node:crypto";

export const APPOINTMENT_ACCESS_COOKIE = "jane-appointment-access";
export const APPOINTMENT_ACCESS_TTL_SECONDS = 60 * 60;

export function appointmentAccessCookieOptions(environment: string | undefined) {
  return {
    httpOnly: true,
    secure: environment === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: APPOINTMENT_ACCESS_TTL_SECONDS,
  };
}

function signingSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("NEXTAUTH_SECRET must be configured with at least 16 characters");
  }
  return secret;
}

function signature(appointmentId: string, expiresAt: number): string {
  return createHmac("sha256", signingSecret())
    .update(`${appointmentId}:${expiresAt}`)
    .digest("hex");
}

export function createAppointmentAccessToken(appointmentId: string, now = Date.now()): string {
  if (!appointmentId) throw new TypeError("appointmentId is required");
  const expiresAt = now + APPOINTMENT_ACCESS_TTL_SECONDS * 1000;
  return `${expiresAt}.${signature(appointmentId, expiresAt)}`;
}

export function verifyAppointmentAccessToken(
  token: string | undefined,
  appointmentId: string,
  now = Date.now()
): boolean {
  if (!appointmentId || !token || !/^\d{13}\.[a-f0-9]{64}$/.test(token)) return false;
  const [expiresAtText, receivedSignature] = token.split(".");
  const expiresAt = Number(expiresAtText);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now) return false;

  try {
    const expectedSignature = signature(appointmentId, expiresAt);
    return timingSafeEqual(Buffer.from(receivedSignature, "hex"), Buffer.from(expectedSignature, "hex"));
  } catch {
    return false;
  }
}
