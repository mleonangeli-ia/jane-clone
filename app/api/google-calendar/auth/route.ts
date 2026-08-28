import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
  createGoogleOAuthSecurityParams,
  googleOAuthCookieOptions,
} from "@/lib/google-oauth-security";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { state, codeVerifier, codeChallenge } = createGoogleOAuthSecurityParams();
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/google-calendar/callback`,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.events",
    access_type: "offline",
    prompt: "consent",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const response = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  const cookieOptions = googleOAuthCookieOptions(process.env.NODE_ENV);
  response.cookies.set("google-oauth-state", state, cookieOptions);
  response.cookies.set("google-oauth-verifier", codeVerifier, cookieOptions);
  return response;
}
