import { NextResponse } from "next/server";
import { getVapidKeys } from "@/lib/push/vapid";

// Public endpoint — returns only the public key
export async function GET() {
  const { publicKey } = getVapidKeys();
  return NextResponse.json({ publicKey });
}
