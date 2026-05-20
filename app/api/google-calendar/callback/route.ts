import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`);

  const code = req.nextUrl.searchParams.get("code");
  if (!code) return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?gc=error`);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/google-calendar/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?gc=error`);

  const data = await res.json();
  if (data.refresh_token) {
    await prisma.tenant.update({
      where: { id: session.user.id },
      data: { googleRefreshToken: data.refresh_token },
    });
  }

  return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?gc=connected`);
}
