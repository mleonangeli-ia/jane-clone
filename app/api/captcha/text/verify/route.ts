export const runtime = 'nodejs';

import { type NextRequest, NextResponse } from 'next/server';
import { verifyText } from '@/lib/captcha/text';

export async function POST(req: NextRequest) {
  let body: { token?: string; code?: string } = {};
  try { body = await req.json(); } catch { /**/ }

  const result = verifyText(body.token ?? '', body.code ?? '');
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
