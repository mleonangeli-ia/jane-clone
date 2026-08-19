export const runtime = 'nodejs';

import { type NextRequest, NextResponse } from 'next/server';
import { getMathData } from '@/lib/captcha/math';
import { renderMathPng } from '@/lib/captcha/math-renderer';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? '';
  const data  = getMathData(token);
  if (!data) return new NextResponse(null, { status: 404 });

  const buf = renderMathPng(data.a, data.b);
  return new NextResponse(new Uint8Array(buf), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' },
  });
}
