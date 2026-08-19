/**
 * Pure Node.js PNG renderer for the puzzle captcha.
 * No native dependencies — runs in Next.js API routes (nodejs runtime).
 */
import zlib from 'zlib';

// ── PNG encoder ───────────────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function u32be(n: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0, 0);
  return b;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const t = Buffer.from(type, 'ascii');
  return Buffer.concat([u32be(data.length), t, data, u32be(crc32(Buffer.concat([t, data])))]);
}

export function encodePng(w: number, h: number, rgba: Uint8Array): Buffer {
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) {
    const base = y * (w * 4 + 1);
    raw[base] = 0;
    for (let x = 0; x < w; x++) {
      const s = (y * w + x) * 4, d = base + 1 + x * 4;
      raw[d] = rgba[s]; raw[d+1] = rgba[s+1]; raw[d+2] = rgba[s+2]; raw[d+3] = rgba[s+3];
    }
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', Buffer.concat([u32be(w), u32be(h), Buffer.from([8, 6, 0, 0, 0])])),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 6 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Color helpers ─────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2*l-1)) * s;
  const x = c * (1 - Math.abs(((h/60)%2)-1));
  const m = l - c/2;
  let r=0,g=0,b=0;
  if      (h<60)  {r=c;g=x;}
  else if (h<120) {r=x;g=c;}
  else if (h<180) {g=c;b=x;}
  else if (h<240) {g=x;b=c;}
  else if (h<300) {r=x;b=c;}
  else            {r=c;b=x;}
  return [Math.round((r+m)*255), Math.round((g+m)*255), Math.round((b+m)*255)];
}

function over(dR:number,dG:number,dB:number,sR:number,sG:number,sB:number,a:number):[number,number,number]{
  return [Math.round(lerp(dR,sR,a)),Math.round(lerp(dG,sG,a)),Math.round(lerp(dB,sB,a))];
}

const STOPS = [
  {t:0.0,r:0x66,g:0x7e,b:0xea},
  {t:0.5,r:0x7c,g:0x3a,b:0xed},
  {t:1.0,r:0xdb,g:0x28,b:0x77},
];

function gradientAt(x:number,y:number,w:number,h:number):[number,number,number] {
  const t = Math.min(1, (x/w+y/h)/2);
  for (let i=0; i<STOPS.length-1; i++) {
    const a=STOPS[i],b=STOPS[i+1];
    if (t<=b.t) {
      const f=(t-a.t)/(b.t-a.t);
      return [Math.round(lerp(a.r,b.r,f)),Math.round(lerp(a.g,b.g,f)),Math.round(lerp(a.b,b.b,f))];
    }
  }
  return [STOPS.at(-1)!.r,STOPS.at(-1)!.g,STOPS.at(-1)!.b];
}

// ── Scene ─────────────────────────────────────────────────────────────────────

interface Circle { cx:number; cy:number; r:number; color:[number,number,number]; alpha:number; }

function buildCircles(seed:number,w:number,h:number):Circle[] {
  let s=seed>>>0;
  const rng=()=>{s=(Math.imul(1664525,s)+1013904223)|0;return(s>>>0)/0xffffffff;};
  return Array.from({length:14},()=>({
    cx:rng()*w,cy:rng()*h,r:8+rng()*34,
    color:hslToRgb(rng()*360,0.8,0.75),alpha:0.12+rng()*0.22,
  }));
}

function renderPixels(w:number,h:number,circles:Circle[],hole:{px:number;py:number;pw:number;ph:number}|null):Uint8Array {
  const buf=new Uint8Array(w*h*4);
  for (let y=0;y<h;y++) {
    for (let x=0;x<w;x++) {
      let [r,g,b]=gradientAt(x,y,w,h);
      if (x%20===0||y%20===0) [r,g,b]=over(r,g,b,255,255,255,0.07);
      for (const c of circles) {
        const dx=x-c.cx,dy=y-c.cy;
        if (dx*dx+dy*dy<=c.r*c.r) [r,g,b]=over(r,g,b,c.color[0],c.color[1],c.color[2],c.alpha);
      }
      if (hole) {
        const {px,py,pw,ph}=hole;
        const inside=x>=px&&x<px+pw&&y>=py&&y<py+ph;
        if (inside) {
          const edge=x===px||x===px+pw-1||y===py||y===py+ph-1;
          [r,g,b]=edge?over(r,g,b,255,255,255,0.45):over(r,g,b,0,0,0,0.38);
        }
      }
      const i=(y*w+x)*4;
      buf[i]=r;buf[i+1]=g;buf[i+2]=b;buf[i+3]=255;
    }
  }
  return buf;
}

// ── Public API ────────────────────────────────────────────────────────────────

export const BG_W=320,BG_H=120,PW=52,PH=72,PY=Math.round((BG_H-PH)/2);
export const SLIDER_MAX=BG_W-PW;

export interface RenderOpts {
  width:number; height:number;
  holePx:number; holePy:number; holePw:number; holePh:number;
  seed:number;
}

export function renderBackground(o:RenderOpts):Buffer {
  const circles=buildCircles(o.seed,o.width,o.height);
  const pixels=renderPixels(o.width,o.height,circles,{px:o.holePx,py:o.holePy,pw:o.holePw,ph:o.holePh});
  return encodePng(o.width,o.height,pixels);
}

export function renderPiece(o:RenderOpts):Buffer {
  const circles=buildCircles(o.seed,o.width,o.height);
  const full=renderPixels(o.width,o.height,circles,null);
  const piece=new Uint8Array(o.holePw*o.holePh*4);
  for (let py=0;py<o.holePh;py++) {
    for (let px=0;px<o.holePw;px++) {
      const si=((o.holePy+py)*o.width+(o.holePx+px))*4;
      const di=(py*o.holePw+px)*4;
      piece[di]=full[si];piece[di+1]=full[si+1];piece[di+2]=full[si+2];piece[di+3]=full[si+3];
    }
  }
  return encodePng(o.holePw,o.holePh,piece);
}
