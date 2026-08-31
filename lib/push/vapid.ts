/**
 * VAPID key generation and JWT signing for Web Push.
 * Pure Node.js — no external dependencies.
 */
import crypto from "node:crypto";

export type VapidKeys = { publicKey: string; privateKey: string };

/** Generate a new VAPID key pair (EC P-256) */
export function generateVapidKeys(): VapidKeys {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: "prime256v1",
  });

  const pubJwk  = publicKey.export({ format: "jwk" }) as { x: string; y: string };
  const privJwk = privateKey.export({ format: "jwk" }) as { d: string; x: string; y: string };

  // Uncompressed public key: 0x04 || x || y
  const x = Buffer.from(pubJwk.x, "base64url");
  const y = Buffer.from(pubJwk.y, "base64url");
  const uncompressed = Buffer.concat([Buffer.from([0x04]), x, y]);

  return {
    publicKey:  uncompressed.toString("base64url"),
    privateKey: JSON.stringify(privJwk), // store full JWK for signing
  };
}

/** Create a VAPID JWT for a given push endpoint origin */
export function createVapidJWT(
  audience:    string,  // e.g. https://fcm.googleapis.com
  subject:     string,  // mailto: or URL
  privateKeyJson: string,
): string {
  const jwk = JSON.parse(privateKeyJson);
  const privateKey = crypto.createPrivateKey({ key: jwk, format: "jwk" });

  const header  = Buffer.from(JSON.stringify({ alg: "ES256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    aud: audience,
    exp: Math.round(Date.now() / 1000) + 12 * 3600,
    sub: subject,
  })).toString("base64url");

  const msg    = `${header}.${payload}`;
  const sign   = crypto.createSign("SHA256");
  sign.update(msg);
  const derSig = sign.sign(privateKey);

  // DER → raw r||s (each 32 bytes)
  const rLen = derSig[3];
  const r    = derSig.slice(4, 4 + rLen).slice(-32);
  const sOff = 4 + rLen + 2;
  const sLen = derSig[sOff - 1];
  const s    = derSig.slice(sOff, sOff + sLen).slice(-32);

  const rawSig = Buffer.concat([
    Buffer.alloc(32 - r.length), r,
    Buffer.alloc(32 - s.length), s,
  ]).toString("base64url");

  return `${msg}.${rawSig}`;
}

export function getVapidKeys(): VapidKeys {
  const pub  = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;

  if (!pub || !priv) {
    throw new Error("VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be configured");
  }

  const decodedPublicKey = Buffer.from(pub, "base64url");
  if (decodedPublicKey.length !== 65 || decodedPublicKey[0] !== 0x04) {
    throw new Error("VAPID_PUBLIC_KEY is invalid");
  }

  try {
    const jwk = JSON.parse(priv) as { kty?: string; crv?: string; d?: string; x?: string; y?: string };
    if (jwk.kty !== "EC" || jwk.crv !== "P-256" || !jwk.d || !jwk.x || !jwk.y) {
      throw new Error("invalid JWK");
    }
    crypto.createPrivateKey({ key: jwk, format: "jwk" });
    const publicKeyFromPrivate = Buffer.concat([
      Buffer.from([0x04]),
      Buffer.from(jwk.x, "base64url"),
      Buffer.from(jwk.y, "base64url"),
    ]);
    if (
      publicKeyFromPrivate.length !== decodedPublicKey.length ||
      !crypto.timingSafeEqual(publicKeyFromPrivate, decodedPublicKey)
    ) {
      throw new Error("mismatched key pair");
    }
  } catch {
    throw new Error("VAPID_PRIVATE_KEY is invalid");
  }

  return { publicKey: pub, privateKey: priv };
}

export function getVapidSubject(): string {
  const subject = process.env.VAPID_SUBJECT;
  if (!subject || (!subject.startsWith("mailto:") && !subject.startsWith("https://"))) {
    throw new Error("VAPID_SUBJECT must be a mailto: or HTTPS URL");
  }
  return subject;
}
