import crypto from "crypto";

export function generateInvoiceToken(invoiceId: string, createdAt: Date): string {
  const secret = process.env.NEXTAUTH_SECRET ?? "dev-secret";
  return crypto
    .createHmac("sha256", secret)
    .update(`${invoiceId}:${createdAt.toISOString()}`)
    .digest("hex")
    .slice(0, 32);
}

export function verifyInvoiceToken(token: string, invoiceId: string, createdAt: Date): boolean {
  return crypto.timingSafeEqual(
    Buffer.from(token, "hex"),
    Buffer.from(generateInvoiceToken(invoiceId, createdAt), "hex"),
  );
}
