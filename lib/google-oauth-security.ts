import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export type GoogleOAuthSecurityParams = {
  state: string;
  codeVerifier: string;
  codeChallenge: string;
};

export const GOOGLE_OAUTH_COOKIE_TTL_SECONDS = 10 * 60;

export function googleOAuthCookieOptions(
  environment: string | undefined,
  maxAge = GOOGLE_OAUTH_COOKIE_TTL_SECONDS,
) {
  return {
    httpOnly: true,
    secure: environment === "production",
    sameSite: "lax" as const,
    path: "/api/google-calendar/callback",
    maxAge,
  };
}

export function getGoogleRefreshToken(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || !("refresh_token" in payload)) return null;
  const refreshToken = payload.refresh_token;
  return typeof refreshToken === "string" && refreshToken.length > 0 ? refreshToken : null;
}

export function createGoogleOAuthSecurityParams(): GoogleOAuthSecurityParams {
  const state = randomBytes(32).toString("base64url");
  const codeVerifier = randomBytes(64).toString("base64url");
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");
  return { state, codeVerifier, codeChallenge };
}

export function googleOAuthStateMatches(
  received: string | null,
  expected: string | undefined,
): boolean {
  if (!received || !expected) return false;
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}
