import { encodePng } from './renderer';

const FONT: Record<string, number[]> = {
  '0': [0b01110,0b10001,0b10011,0b10101,0b11001,0b10001,0b01110],
  '1': [0b00100,0b01100,0b00100,0b00100,0b00100,0b00100,0b01110],
  '2': [0b01110,0b10001,0b00001,0b00110,0b01000,0b10000,0b11111],
  '3': [0b11110,0b00001,0b00001,0b01110,0b00001,0b00001,0b11110],
  '4': [0b00010,0b00110,0b01010,0b10010,0b11111,0b00010,0b00010],
  '5': [0b11111,0b10000,0b10000,0b11110,0b00001,0b00001,0b11110],
  '6': [0b01110,0b10000,0b10000,0b11110,0b10001,0b10001,0b01110],
  '7': [0b11111,0b00001,0b00010,0b00100,0b01000,0b01000,0b01000],
  '8': [0b01110,0b10001,0b10001,0b01110,0b10001,0b10001,0b01110],
  '9': [0b01110,0b10001,0b10001,0b01111,0b00001,0b00010,0b01100],
  '+': [0b00000,0b00100,0b00100,0b11111,0b00100,0b00100,0b00000],
  '=': [0b00000,0b00000,0b11111,0b00000,0b11111,0b00000,0b00000],
  '?': [0b01110,0b10001,0b00001,0b00110,0b00100,0b00000,0b00100],
  ' ': [0b00000,0b00000,0b00000,0b00000,0b00000,0b00000,0b00000],
};

const SCALE = 5, CHAR_W = 5, CHAR_H = 7, GAP = 3, PAD_X = 16, PAD_Y = 14;
const STEP  = CHAR_W * SCALE + GAP;

const COLORS: [number, number, number][] = [
  [30,30,90],[20,50,80],[40,20,100],[10,40,70],[50,10,90],[30,60,70],[20,30,110],
];

export function renderMathPng(a: number, b: number): Buffer {
  const text = `${a} + ${b} = ?`;
  const W = PAD_X * 2 + text.length * STEP - GAP;
  const H = PAD_Y * 2 + CHAR_H * SCALE;
  const rgba = new Uint8Array(W * H * 4);

  // Background gradient
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const t = x / W;
      const i = (y * W + x) * 4;
      rgba[i]=Math.round(235+10*t); rgba[i+1]=Math.round(237+8*t); rgba[i+2]=Math.round(248+4*t); rgba[i+3]=255;
    }
  }

  // Seeded noise
  let s = ((a*1009+b*997)&0x7fffffff)>>>0;
  const rng=()=>{s=(Math.imul(1664525,s)+1013904223)|0;return(s>>>0)/0xffffffff;};
  for (let n=0;n<350;n++){
    const nx=Math.floor(rng()*W),ny=Math.floor(rng()*H),i=(ny*W+nx)*4;
    rgba[i]=Math.floor(rng()*100)+80;rgba[i+1]=Math.floor(rng()*100)+100;rgba[i+2]=Math.floor(rng()*120)+120;rgba[i+3]=Math.floor(rng()*180)+40;
  }

  // Characters
  for (let ci=0;ci<text.length;ci++){
    const bitmap=FONT[text[ci]]??FONT[' '];
    const [cr,cg,cb]=COLORS[ci%COLORS.length];
    const bx=PAD_X+ci*STEP;
    for (let row=0;row<CHAR_H;row++){
      for (let col=0;col<CHAR_W;col++){
        if (bitmap[row]&(1<<(CHAR_W-1-col))){
          for (let dy=0;dy<SCALE;dy++) for (let dx=0;dx<SCALE;dx++){
            const px=bx+col*SCALE+dx,py=PAD_Y+row*SCALE+dy;
            if (px>=0&&px<W&&py>=0&&py<H){const i=(py*W+px)*4;rgba[i]=cr;rgba[i+1]=cg;rgba[i+2]=cb;rgba[i+3]=255;}
          }
        }
      }
    }
  }

  // Interference line
  const lineY=Math.round(PAD_Y+CHAR_H*SCALE*0.45);
  for (let x=PAD_X;x<W-PAD_X;x++){
    const i=(lineY*W+x)*4;
    rgba[i]=Math.min(255,rgba[i]+40);rgba[i+1]=Math.min(255,rgba[i+1]+40);rgba[i+2]=Math.min(255,rgba[i+2]+50);
  }

  return encodePng(W,H,rgba);
}
