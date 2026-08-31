import { encryptToken, decryptToken } from './token';
import { randomInt } from 'node:crypto';
import { createProof } from './proof';

const MIN_MS = 2_000;
const MAX_MS = 10 * 60_000;

interface MathPayload { captchaType: 'math'; a: number; b: number; answer: number; ts: number; }

export function generateMath(): { token: string; } {
  const a      = randomInt(10, 50); // 10–49
  const b      = randomInt(10, 50); // 10–49
  const answer = a + b;
  return { token: encryptToken({ captchaType: 'math', a, b, answer, ts: Date.now() } satisfies MathPayload) };
}

export function getMathData(token: string): MathPayload | null {
  const d = decryptToken<MathPayload>(token);
  return d?.captchaType === 'math' ? d : null;
}

export function verifyMath(token: string, userAnswer: number): { ok: boolean; reason?: string; proof?: string } {
  const d = getMathData(token);
  if (!d) return { ok: false, reason: 'invalid_token' };

  const elapsed = Date.now() - d.ts;
  if (elapsed < MIN_MS) return { ok: false, reason: 'too_fast' };
  if (elapsed > MAX_MS) return { ok: false, reason: 'too_slow' };

  if (!Number.isFinite(userAnswer) || userAnswer !== d.answer) {
    return { ok: false, reason: 'wrong_answer' };
  }

  return {
    ok: true,
    proof: createProof('math', d.ts),
  };
}
