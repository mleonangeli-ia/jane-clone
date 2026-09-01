import { decryptToken, encryptToken } from './token';

export const CAPTCHA_PROOF_TTL_MS = 5 * 60_000;

export type CaptchaType = 'math' | 'puzzle' | 'text';

interface ProofPayload {
  type: 'proof';
  captchaType: CaptchaType;
  challengeIssuedAt: number;
  issuedAt: number;
}

export type ValidCaptchaProof = {
  expiresAt: Date;
};

export function createProof(captchaType: CaptchaType, challengeIssuedAt: number): string {
  return encryptToken({
    type: 'proof',
    captchaType,
    challengeIssuedAt,
    issuedAt: Date.now(),
  } satisfies ProofPayload);
}

export function getValidProof(
  proof: string,
  now = Date.now(),
): ValidCaptchaProof | null {
  if (!proof) return null;

  const data = decryptToken<ProofPayload>(proof);
  if (
    !data ||
    data.type !== 'proof' ||
    !['math', 'puzzle', 'text'].includes(data.captchaType) ||
    !Number.isFinite(data.challengeIssuedAt) ||
    !Number.isFinite(data.issuedAt)
  ) {
    return null;
  }

  const age = now - data.issuedAt;
  if (age < 0 || age > CAPTCHA_PROOF_TTL_MS) return null;

  return { expiresAt: new Date(data.issuedAt + CAPTCHA_PROOF_TTL_MS) };
}

export function validateProof(proof: string, now = Date.now()): boolean {
  return getValidProof(proof, now) !== null;
}
