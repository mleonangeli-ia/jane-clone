/**
 * Stateless AES-256-GCM token helpers.
 * All captcha state (correctX, seed, timestamps) travels encrypted in the token.
 * No server-side Map/Set — works in Next.js serverless (Vercel).
 */
import crypto from 'crypto';

// Compute key lazily so process.env.CAPTCHA_SECRET can be set before first call.
// This is intentional: Next.js initializes modules before env vars are ready in tests.
let _key: Buffer | null = null;
function getKey(): Buffer {
  if (!_key) {
    _key = crypto.createHash('sha256')
      .update(process.env.CAPTCHA_SECRET ?? 'dev-secret-change-in-production')
      .digest();
  }
  return _key;
}

export function encryptToken(data: object): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const plaintext = Buffer.from(JSON.stringify(data));
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag(); // 16 bytes
  // Layout: [12 iv][16 tag][...ciphertext]
  return Buffer.concat([iv, tag, ciphertext]).toString('base64url');
}

/** Only call in test environments to reset the cached key. */
export function _resetKeyForTesting(): void { _key = null; }

export function decryptToken<T>(token: string): T | null {
  try {
    const buf = Buffer.from(token, 'base64url');
    if (buf.length < 29) return null; // iv(12) + tag(16) + min 1 byte data
    const iv         = buf.subarray(0, 12);
    const tag        = buf.subarray(12, 28);
    const ciphertext = buf.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return JSON.parse(plain.toString()) as T;
  } catch {
    return null;
  }
}
