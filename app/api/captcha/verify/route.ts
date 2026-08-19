export const runtime = 'nodejs';

import { type NextRequest, NextResponse } from 'next/server';
import { verifyPosition } from '@/lib/captcha/puzzle';

export async function POST(req: NextRequest) {
  let body: { token?: string; px?: number } = {};
  try { body = await req.json(); } catch { /**/ }

  const result = verifyPosition(body.token ?? '', Number(body.px ?? -1));
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
