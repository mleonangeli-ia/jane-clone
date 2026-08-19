export const runtime = 'nodejs';

import { type NextRequest, NextResponse } from 'next/server';
import { getTextData } from '@/lib/captcha/text';
import { renderTextPng } from '@/lib/captcha/text-renderer';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? '';
  const data  = getTextData(token);
  if (!data) return new NextResponse(null, { status: 404 });

  const buf = renderTextPng(data.code, data.seed);
  return new NextResponse(new Uint8Array(buf), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' },
  });
}
