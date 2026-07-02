import { NextResponse } from "next/server";
import { PATIENT_COOKIE } from "@/lib/patient-auth";

export async function POST() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = NextResponse.redirect(`${appUrl}/patient`);
  res.cookies.set(PATIENT_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
