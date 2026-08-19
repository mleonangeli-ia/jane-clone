import { encodePng } from './renderer';

const FONT: Record<string, number[]> = {
  '2':[0b01110,0b10001,0b00001,0b00110,0b01000,0b10000,0b11111],
  '3':[0b11110,0b00001,0b00001,0b01110,0b00001,0b00001,0b11110],
  '4':[0b00010,0b00110,0b01010,0b10010,0b11111,0b00010,0b00010],
  '5':[0b11111,0b10000,0b10000,0b11110,0b00001,0b00001,0b11110],
  '6':[0b01110,0b10000,0b10000,0b11110,0b10001,0b10001,0b01110],
  '7':[0b11111,0b00001,0b00010,0b00100,0b01000,0b01000,0b01000],
  '8':[0b01110,0b10001,0b10001,0b01110,0b10001,0b10001,0b01110],
  '9':[0b01110,0b10001,0b10001,0b01111,0b00001,0b00010,0b01100],
  'A':[0b01110,0b10001,0b10001,0b11111,0b10001,0b10001,0b10001],
  'B':[0b11110,0b10001,0b10001,0b11110,0b10001,0b10001,0b11110],
  'C':[0b01110,0b10001,0b10000,0b10000,0b10000,0b10001,0b01110],
  'D':[0b11110,0b10001,0b10001,0b10001,0b10001,0b10001,0b11110],
  'E':[0b11111,0b10000,0b10000,0b11100,0b10000,0b10000,0b11111],
  'F':[0b11111,0b10000,0b10000,0b11100,0b10000,0b10000,0b10000],
  'G':[0b01110,0b10001,0b10000,0b10111,0b10001,0b10001,0b01111],
  'H':[0b10001,0b10001,0b10001,0b11111,0b10001,0b10001,0b10001],
  'J':[0b00111,0b00010,0b00010,0b00010,0b10010,0b10010,0b01100],
  'K':[0b10001,0b10010,0b10100,0b11000,0b10100,0b10010,0b10001],
  'M':[0b10001,0b11011,0b10101,0b10101,0b10001,0b10001,0b10001],
  'N':[0b10001,0b11001,0b10101,0b10011,0b10001,0b10001,0b10001],
  'P':[0b11110,0b10001,0b10001,0b11110,0b10000,0b10000,0b10000],
  'R':[0b11110,0b10001,0b10001,0b11110,0b10100,0b10010,0b10001],
  'S':[0b01110,0b10001,0b10000,0b01110,0b00001,0b10001,0b01110],
  'T':[0b11111,0b00100,0b00100,0b00100,0b00100,0b00100,0b00100],
  'U':[0b10001,0b10001,0b10001,0b10001,0b10001,0b10001,0b01110],
  'V':[0b10001,0b10001,0b10001,0b01010,0b01010,0b00100,0b00100],
  'W':[0b10001,0b10001,0b10101,0b10101,0b10101,0b11011,0b10001],
  'X':[0b10001,0b01010,0b00100,0b00100,0b00100,0b01010,0b10001],
  'Y':[0b10001,0b10001,0b01010,0b00100,0b00100,0b00100,0b00100],
  'Z':[0b11111,0b00001,0b00010,0b00100,0b01000,0b10000,0b11111],
};

const SCALE=8,CHAR_W=5,CHAR_H=7,CW=CHAR_W*SCALE,CH=CHAR_H*SCALE,GAP=8,PAD_X=18,PAD_Y=22;

export function renderTextPng(text: string, seed: number): Buffer {
  const W=PAD_X*2+text.length*(CW+GAP)-GAP;
  const H=PAD_Y*2+CH;
  const flat=new Uint8Array(W*H*4);

  let s=seed>>>0;
  const rng=()=>{s=(Math.imul(1664525,s)+1013904223)|0;return(s>>>0)/0xffffffff;};

  // Background
  for (let y=0;y<H;y++) for (let x=0;x<W;x++){
    const t=x/W,i=(y*W+x)*4;
    flat[i]=Math.round(244+8*t);flat[i+1]=Math.round(245+7*t);flat[i+2]=Math.round(250+5*t);flat[i+3]=255;
  }

  // Characters
  const COLORS:Array<[number,number,number]>=[[20,20,80],[40,10,90],[15,30,70],[35,15,95],[25,25,85]];
  for (let ci=0;ci<text.length;ci++){
    const bitmap=FONT[text[ci]]??FONT['A'];
    const [cr,cg,cb]=COLORS[ci%COLORS.length];
    const charX=PAD_X+ci*(CW+GAP);
    for (let row=0;row<CHAR_H;row++) for (let col=0;col<CHAR_W;col++){
      if (bitmap[row]&(1<<(CHAR_W-1-col))){
        for (let dy=0;dy<SCALE;dy++) for (let dx=0;dx<SCALE;dx++){
          const px=charX+col*SCALE+dx,py=PAD_Y+row*SCALE+dy;
          if (px>=0&&px<W&&py>=0&&py<H){const i=(py*W+px)*4;flat[i]=cr;flat[i+1]=cg;flat[i+2]=cb;flat[i+3]=255;}
        }
      }
    }
  }

  // Wave distortion
  const rgba=new Uint8Array(W*H*4);
  const wAX=5+rng()*4,wAY=5+rng()*4,wLX=50+rng()*40,wLY=40+rng()*30,pX=rng()*Math.PI*2,pY=rng()*Math.PI*2;
  for (let py=0;py<H;py++) for (let px=0;px<W;px++){
    const sx=Math.round(px+wAX*Math.sin(2*Math.PI*py/wLX+pX));
    const sy=Math.round(py+wAY*Math.sin(2*Math.PI*px/wLY+pY));
    const di=(py*W+px)*4;
    if (sx>=0&&sx<W&&sy>=0&&sy<H){const si=(sy*W+sx)*4;rgba[di]=flat[si];rgba[di+1]=flat[si+1];rgba[di+2]=flat[si+2];rgba[di+3]=flat[si+3];}
    else{rgba[di]=248;rgba[di+1]=249;rgba[di+2]=252;rgba[di+3]=255;}
  }

  // Noise
  for (let n=0;n<600;n++){
    const px=Math.floor(rng()*W),py=Math.floor(rng()*H),i=(py*W+px)*4;
    rgba[i]=Math.floor(rng()*120)+40;rgba[i+1]=Math.floor(rng()*120)+60;rgba[i+2]=Math.floor(rng()*150)+80;rgba[i+3]=Math.floor(rng()*160)+60;
  }

  // Crossing lines
  for (let l=0;l<4;l++){
    const ly=PAD_Y/2+Math.floor(rng()*(H-PAD_Y));
    const lr=Math.floor(rng()*80)+80,lg=Math.floor(rng()*80)+80,lb=Math.floor(rng()*100)+120;
    const la=3+rng()*4,lph=rng()*Math.PI*2,lld=60+rng()*40;
    for (let px=0;px<W;px++){
      const py=Math.round(ly+la*Math.sin(2*Math.PI*px/lld+lph));
      for (let t=-1;t<=1;t++) if (py+t>=0&&py+t<H){const i=((py+t)*W+px)*4;rgba[i]=lr;rgba[i+1]=lg;rgba[i+2]=lb;rgba[i+3]=220;}
    }
  }

  return encodePng(W,H,rgba);
}
