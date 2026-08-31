import { decryptToken, encryptToken } from './token';

export const CAPTCHA_PROOF_TTL_MS = 5 * 60_000;

export type CaptchaType = 'math' | 'puzzle' | 'text';

interface ProofPayload {
  type: 'proof';
  captchaType: CaptchaType;
  challengeIssuedAt: number;
  issuedAt: number;
}

export function createProof(captchaType: CaptchaType, challengeIssuedAt: number): string {
  return encryptToken({
    type: 'proof',
    captchaType,
    challengeIssuedAt,
    issuedAt: Date.now(),
  } satisfies ProofPayload);
}

export function validateProof(proof: string, now = Date.now()): boolean {
  if (!proof) return false;

  const data = decryptToken<ProofPayload>(proof);
  if (
    !data ||
    data.type !== 'proof' ||
    !['math', 'puzzle', 'text'].includes(data.captchaType) ||
    !Number.isFinite(data.challengeIssuedAt) ||
    !Number.isFinite(data.issuedAt)
  ) {
    return false;
  }

  const age = now - data.issuedAt;
  return age >= 0 && age <= CAPTCHA_PROOF_TTL_MS;
}
