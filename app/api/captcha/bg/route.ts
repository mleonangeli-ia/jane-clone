export const runtime = 'nodejs';

import { type NextRequest, NextResponse } from 'next/server';
import { getPuzzleData } from '@/lib/captcha/puzzle';
import { renderBackground, BG_W, BG_H, PW, PH, PY } from '@/lib/captcha/renderer';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? '';
  const data  = getPuzzleData(token);
  if (!data) return new NextResponse(null, { status: 404 });

  const correctPx = Math.round((data.correctX / 100) * (BG_W - PW));
  const buf = renderBackground({ width: BG_W, height: BG_H, holePx: correctPx, holePy: PY, holePw: PW, holePh: PH, seed: data.seed });

  return new NextResponse(new Uint8Array(buf), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' },
  });
}
