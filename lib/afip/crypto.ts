import crypto from "crypto";

const ALG = "aes-256-gcm";

function getKey() {
  const secret = process.env.NEXTAUTH_SECRET ?? "dev-secret-change-in-production";
  return crypto.createHash("sha256").update(secret).digest();
}

/** Encrypts a PEM string for storage */
export function encryptPem(pem: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALG, getKey(), iv);
  const enc = Buffer.concat([cipher.update(pem, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

/** Decrypts a stored PEM string */
export function decryptPem(stored: string): string {
  const [ivHex, tagHex, encHex] = stored.split(":");
  const iv  = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const enc = Buffer.from(encHex, "hex");
  const decipher = crypto.createDecipheriv(ALG, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

/** Generates the AFIP QR data URL */
export function buildAfipQR(params: {
  ver: number;
  fecha: string;
  cuit: number;
  ptoVta: number;
  tipoCmp: number;
  nroCmp: number;
  importe: number;
  moneda: string;
  ctz: number;
  tipoDocRec: number;
  nroDocRec: number;
  tipoCodAut: string;
  codAut: number;
}): string {
  const base = Buffer.from(JSON.stringify(params)).toString("base64url");
  return `https://www.afip.gob.ar/fe/qr/?p=${base}`;
}
