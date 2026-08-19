/**
 * Stateless puzzle captcha — all state lives in the encrypted token.
 * Works in Next.js serverless (no Maps, no Sets).
 */
import { encryptToken, decryptToken } from './token';
import { SLIDER_MAX } from './renderer';

const MIN_MS    = 2_000;
const MAX_MS    = 10 * 60_000;
const TOLERANCE = 5;       // ±5 % of slider range
const PROOF_TTL = 5 * 60_000; // proof valid 5 minutes

interface PuzzlePayload { correctX: number; seed: number; ts: number; }
interface ProofPayload  { type: 'proof'; puzzleTs: number; issuedAt: number; }

export function generatePuzzle(): { token: string } {
  const correctX = 15 + Math.floor(Math.random() * 60); // 15–74
  const seed     = (Math.random() * 0x7fffffff) | 0;
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

  const proof = encryptToken({ type: 'proof', puzzleTs: data.ts, issuedAt: Date.now() } satisfies ProofPayload);
  return { ok: true, proof };
}

/**
 * Called in the Next.js proxy before forwarding to the Java backend.
 * Returns true if the proof is cryptographically valid and recent.
 */
export function validateProof(proof: string): boolean {
  const data = decryptToken<ProofPayload>(proof);
  if (!data || data.type !== 'proof') return false;
  if (Date.now() - data.issuedAt > PROOF_TTL) return false;
  return true;
}

export { SLIDER_MAX };
