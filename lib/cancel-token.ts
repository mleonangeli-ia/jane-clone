import crypto from "crypto";

export function generateCancelToken(appointmentId: string, createdAt: Date): string {
  const secret = process.env.NEXTAUTH_SECRET ?? "fallback";
  const data = `${appointmentId}:${createdAt.toISOString()}`;
  return crypto.createHmac("sha256", secret).update(data).digest("hex").slice(0, 32);
}

export function verifyCancelToken(token: string, appointmentId: string, createdAt: Date): boolean {
  return token === generateCancelToken(appointmentId, createdAt);
}
