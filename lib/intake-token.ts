import crypto from "crypto";

export function generateIntakeToken(responseId: string, createdAt: Date): string {
  const secret = process.env.NEXTAUTH_SECRET ?? "fallback";
  const data = `intake:${responseId}:${createdAt.toISOString()}`;
  return crypto.createHmac("sha256", secret).update(data).digest("hex").slice(0, 32);
}

export function verifyIntakeToken(token: string, responseId: string, createdAt: Date): boolean {
  return token === generateIntakeToken(responseId, createdAt);
}
