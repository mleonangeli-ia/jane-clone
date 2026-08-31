/**
 * Stateless puzzle captcha — all state lives in the encrypted token.
 * Works in Next.js serverless (no Maps, no Sets).
 */
import { encryptToken, decryptToken } from './token';
import { SLIDER_MAX } from './renderer';
import { randomInt } from 'node:crypto';
import { createProof } from './proof';

const MIN_MS    = 2_000;
const MAX_MS    = 10 * 60_000;
const TOLERANCE = 5;       // ±5 % of slider range

interface PuzzlePayload { correctX: number; seed: number; ts: number; }

export function generatePuzzle(): { token: string } {
  const correctX = randomInt(15, 75); // 15–74
  const seed     = randomInt(0, 0x80000000);
  const ts       = Date.now();
  return { token: encryptToken({ correctX, seed, ts } satisfies PuzzlePayload) };
}

/** Returns correctX and seed so the API routes can render PNGs. */
export function getPuzzleData(token: string): PuzzlePayload | null {
  return decryptToken<PuzzlePayload>(token);
}

/** Verifies the user's slider position. Returns a one-time proof on success. */
export function verifyPosition(
  token: string,
  userX: number,
): { ok: boolean; reason?: string; proof?: string } {
  const data = decryptToken<PuzzlePayload>(token);
  if (!data || typeof data.correctX !== 'number') return { ok: false, reason: 'invalid_token' };

  const elapsed = Date.now() - data.ts;
  if (elapsed < MIN_MS)         return { ok: false, reason: 'too_fast' };
  if (elapsed > MAX_MS)         return { ok: false, reason: 'too_slow' };

  if (Math.abs(userX - data.correctX) > TOLERANCE) return { ok: false, reason: 'wrong_position' };

  const proof = createProof('puzzle', data.ts);
  return { ok: true, proof };
}

export { SLIDER_MAX };
