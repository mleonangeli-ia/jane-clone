import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createPatientCookie, PATIENT_COOKIE, PATIENT_COOKIE_MAX_AGE } from "@/lib/patient-auth";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!token) {
    return NextResponse.redirect(`${appUrl}/patient?error=invalid`);
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const record = await prisma.patientMagicToken.findUnique({
    where: { tokenHash },
  });

  if (!record) {
    return NextResponse.redirect(`${appUrl}/patient?error=invalid`);
  }
  if (record.usedAt) {
    return NextResponse.redirect(`${appUrl}/patient?error=used`);
  }
  if (record.expiresAt < new Date()) {
    return NextResponse.redirect(`${appUrl}/patient?error=expired`);
  }

  await prisma.patientMagicToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  const cookieValue = createPatientCookie(record.clientId);

  const res = NextResponse.redirect(`${appUrl}/patient/portal`);
  res.cookies.set(PATIENT_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: PATIENT_COOKIE_MAX_AGE,
    path: "/",
  });

  return res;
}
