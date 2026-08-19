import { encryptToken, decryptToken } from './token';

const MIN_MS  = 2_000;
const MAX_MS  = 10 * 60_000;
const CODE_LEN = 5;

// No ambiguous chars: 0/O, 1/I/L
export const CHARSET = '23456789ABCDEFGHJKMNPRSTUVWXYZ';

interface TextPayload { captchaType: 'text'; code: string; seed: number; ts: number; }
interface ProofPayload { type: 'proof'; captchaType: string; ts: number; }

export function generateText(): { token: string } {
  const code = Array.from({ length: CODE_LEN }, () =>
    CHARSET[Math.floor(Math.random() * CHARSET.length)]
  ).join('');
  const seed = (Math.random() * 0x7fffffff) | 0;
  return { token: encryptToken({ captchaType: 'text', code, seed, ts: Date.now() } satisfies TextPayload) };
}

export function getTextData(token: string): TextPayload | null {
  const d = decryptToken<TextPayload>(token);
  return d?.captchaType === 'text' ? d : null;
}

export function verifyText(token: string, userCode: string): { ok: boolean; reason?: string; proof?: string } {
  const d = getTextData(token);
  if (!d) return { ok: false, reason: 'invalid_token' };

  const elapsed = Date.now() - d.ts;
  if (elapsed < MIN_MS) return { ok: false, reason: 'too_fast' };
  if (elapsed > MAX_MS) return { ok: false, reason: 'too_slow' };

  if (userCode.trim().toUpperCase() !== d.code) return { ok: false, reason: 'wrong_code' };

  return {
    ok: true,
    proof: encryptToken({ type: 'proof', captchaType: 'text', ts: Date.now() } satisfies ProofPayload),
  };
}
