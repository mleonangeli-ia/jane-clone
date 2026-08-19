export const runtime = 'nodejs';

import { type NextRequest, NextResponse } from 'next/server';
import { verifyMath } from '@/lib/captcha/math';

export async function POST(req: NextRequest) {
  let body: { token?: string; answer?: number } = {};
  try { body = await req.json(); } catch { /**/ }

  const result = verifyMath(body.token ?? '', Number(body.answer ?? NaN));
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
