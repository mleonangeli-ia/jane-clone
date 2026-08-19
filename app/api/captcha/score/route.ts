export const runtime = 'nodejs';

import { type NextRequest, NextResponse } from 'next/server';
import { computeScore, levelFromScore, typeFromLevel, type ClientSignals } from '@/lib/captcha/scorer';
import { generateMath } from '@/lib/captcha/math';
import { generatePuzzle } from '@/lib/captcha/puzzle';
import { generateText } from '@/lib/captcha/text';

export async function POST(req: NextRequest) {
  let signals: Partial<ClientSignals> = {};
  try { signals = await req.json(); } catch { /* signals stay empty → worst case */ }

  const ua    = req.headers.get('user-agent') ?? '';
  const score = computeScore(signals as ClientSignals, ua);
  const level = levelFromScore(score);
  const type  = typeFromLevel(level);

  let token: string;
  if      (type === 'math')   token = generateMath().token;
  else if (type === 'puzzle') token = generatePuzzle().token;
  else                        token = generateText().token;

  return NextResponse.json({ level, type, token });
}
