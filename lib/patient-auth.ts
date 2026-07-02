import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE = "patient-session";
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

function secret() {
  return process.env.NEXTAUTH_SECRET ?? "dev-secret";
}

/** Creates a signed cookie value: clientId.timestamp.hmac */
export function createPatientCookie(clientId: string): string {
  const ts   = Date.now().toString();
  const data = `${clientId}.${ts}`;
  const sig  = crypto.createHmac("sha256", secret()).update(data).digest("hex");
  return `${data}.${sig}`;
}

/** Returns clientId if cookie is valid, null otherwise */
export function verifyPatientCookie(value: string): string | null {
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [clientId, ts, sig] = parts;
  const data     = `${clientId}.${ts}`;
  const expected = crypto.createHmac("sha256", secret()).update(data).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return null;
  if (Date.now() - parseInt(ts) > MAX_AGE * 1000) return null;
  return clientId;
}

/** Reads the patient session from the request cookies (server component) */
export async function getPatientSession(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(COOKIE)?.value;
  if (!value) return null;
  return verifyPatientCookie(value);
}

export { COOKIE as PATIENT_COOKIE, MAX_AGE as PATIENT_COOKIE_MAX_AGE };
