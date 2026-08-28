import { createHmac, timingSafeEqual } from "node:crypto";

const MERCADOPAGO_CHECKOUT_HOSTS = new Set([
  "www.mercadopago.com",
  "www.mercadopago.com.ar",
  "sandbox.mercadopago.com",
  "sandbox.mercadopago.com.ar",
]);

export function getSafeMercadoPagoCheckoutUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !MERCADOPAGO_CHECKOUT_HOSTS.has(url.hostname)) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

type MercadoPagoSignatureInput = {
  secret: string | undefined;
  signatureHeader: string | null;
  requestId: string | null;
  dataId: string | null;
};

export function verifyMercadoPagoSignature({
  secret,
  signatureHeader,
  requestId,
  dataId,
}: MercadoPagoSignatureInput): boolean {
  if (!secret || !signatureHeader || !requestId || !dataId) return false;

  const timestamp = signatureHeader.match(/(?:^|,)\s*ts=([^,]+)/)?.[1];
  const receivedHash = signatureHeader.match(/(?:^|,)\s*v1=([^,]+)/)?.[1];
  if (!timestamp || !receivedHash || !/^[a-f0-9]{64}$/i.test(receivedHash)) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
  const expected = createHmac("sha256", secret).update(manifest).digest();
  const received = Buffer.from(receivedHash, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}
