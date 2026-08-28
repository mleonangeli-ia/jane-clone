import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getGoogleRefreshToken,
  googleOAuthCookieOptions,
  googleOAuthStateMatches,
} from "@/lib/google-oauth-security";

function redirectToSettings(status: "connected" | "error") {
  const response = NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?gc=${status}`
  );
  const expiredCookie = googleOAuthCookieOptions(process.env.NODE_ENV, 0);
  response.cookies.set("google-oauth-state", "", expiredCookie);
  response.cookies.set("google-oauth-verifier", "", expiredCookie);
  return response;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`);

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expectedState = req.cookies.get("google-oauth-state")?.value;
  const codeVerifier = req.cookies.get("google-oauth-verifier")?.value;
  if (!code || !codeVerifier || !googleOAuthStateMatches(state, expectedState)) {
    return redirectToSettings("error");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/google-calendar/callback`,
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    }),
  });

  if (!res.ok) return redirectToSettings("error");

  const refreshToken = getGoogleRefreshToken(await res.json());
  if (!refreshToken) return redirectToSettings("error");
  await prisma.tenant.update({
    where: { id: session.user.id },
    data: { googleRefreshToken: refreshToken },
  });

  return redirectToSettings("connected");
}
