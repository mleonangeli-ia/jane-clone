/**
 * VAPID key generation and JWT signing for Web Push.
 * Pure Node.js — no external dependencies.
 */
import crypto from "crypto";

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

/** Returns the VAPID keys from env — or generates and caches in memory for dev */
let _cached: VapidKeys | null = null;

export function getVapidKeys(): VapidKeys {
  const pub  = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;

  if (pub && priv) return { publicKey: pub, privateKey: priv };

  // Dev: auto-generate once
  if (!_cached) {
    _cached = generateVapidKeys();
    console.warn("[push] VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not set — using ephemeral keys (sessions will break on restart)");
  }
  return _cached;
}
