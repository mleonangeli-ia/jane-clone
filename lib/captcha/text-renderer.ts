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

  // Premium gradient background
  for (let y=0;y<H;y++) for (let x=0;x<W;x++){
    const t=x/W, ty=y/H, i=(y*W+x)*4;
    flat[i]=Math.round(245+6*t-4*ty);
    flat[i+1]=Math.round(247+4*t-3*ty);
    flat[i+2]=Math.round(251+3*t-2*ty);
    flat[i+3]=255;
  }

  // Premium colors with high contrast
  const COLORS:Array<[number,number,number]>=[
    [15,85,200], // bright blue
    [200,15,50], // bright red
    [30,140,50], // bright green
    [200,120,0], // bright orange
    [100,10,140], // bright purple
  ];

  // Characters with antialiasing
  for (let ci=0;ci<text.length;ci++){
    const bitmap=FONT[text[ci]]??FONT['A'];
    const [cr,cg,cb]=COLORS[ci%COLORS.length];
    const charX=PAD_X+ci*(CW+GAP);

    for (let row=0;row<CHAR_H;row++) for (let col=0;col<CHAR_W;col++){
      if (bitmap[row]&(1<<(CHAR_W-1-col))){
        // Core pixels
        for (let dy=0;dy<SCALE;dy++) for (let dx=0;dx<SCALE;dx++){
          const px=charX+col*SCALE+dx,py=PAD_Y+row*SCALE+dy;
          if (px>=0&&px<W&&py>=0&&py<H){
            const i=(py*W+px)*4;
            flat[i]=cr;flat[i+1]=cg;flat[i+2]=cb;flat[i+3]=255;
          }
        }
        // Antialiasing edges
        if(rng()<0.4){
          for (let dy=-1;dy<=SCALE;dy++){
            for (let dx=-1;dx<=SCALE;dx++){
              if((dx<0||dx>=SCALE||dy<0||dy>=SCALE)&&Math.abs(dx)<2&&Math.abs(dy)<2){
                const px=charX+col*SCALE+dx,py=PAD_Y+row*SCALE+dy;
                if(px>=0&&px<W&&py>=0&&py<H){
                  const i=(py*W+px)*4;
                  const blend=0.35;
                  flat[i]=Math.round(flat[i]*(1-blend)+cr*blend);
                  flat[i+1]=Math.round(flat[i+1]*(1-blend)+cg*blend);
                  flat[i+2]=Math.round(flat[i+2]*(1-blend)+cb*blend);
                }
              }
            }
          }
        }
      }
    }
  }

  // Enhanced wave distortion (fisheye + wave)
  const rgba=new Uint8Array(W*H*4);
  const wAX=6+rng()*5,wAY=6+rng()*5;
  const wLX=55+rng()*35,wLY=45+rng()*25;
  const pX=rng()*Math.PI*2,pY=rng()*Math.PI*2;
  const fisheye=0.0008+rng()*0.0004;

  for (let py=0;py<H;py++) for (let px=0;px<W;px++){
    const cx=(px-W/2)/W, cy=(py-H/2)/H;
    const r=Math.sqrt(cx*cx+cy*cy);
    const factor=1+fisheye*r*r; // fisheye distortion

    const sx=Math.round(px+wAX*Math.sin(2*Math.PI*py/wLX+pX)*factor);
    const sy=Math.round(py+wAY*Math.sin(2*Math.PI*px/wLY+pY)*factor);
    const di=(py*W+px)*4;
    if (sx>=0&&sx<W&&sy>=0&&sy<H){
      const si=(sy*W+sx)*4;
      rgba[di]=flat[si];rgba[di+1]=flat[si+1];rgba[di+2]=flat[si+2];rgba[di+3]=flat[si+3];
    }
    else{rgba[di]=247;rgba[di+1]=248;rgba[di+2]=251;rgba[di+3]=255;}
  }

  // Intelligent noise: clusters + organic texture
  for (let n=0;n<800;n++){
    const px=Math.floor(rng()*W),py=Math.floor(rng()*H);
    const sz=rng()<0.75?1:(Math.floor(rng()*2)+1); // 75% singles, 25% clusters
    for (let dx=0;dx<sz;dx++){
      for (let dy=0;dy<sz;dy++){
        const cx=px+dx,cy=py+dy;
        if(cx>=0&&cx<W&&cy>=0&&cy<H){
          const i=(cy*W+cx)*4;
          const gray=Math.floor(rng()*100)+60;
          const alpha=Math.floor(rng()*140)+50;
          rgba[i]=Math.round(rgba[i]*0.8+gray*0.2);
          rgba[i+1]=Math.round(rgba[i+1]*0.8+gray*0.2);
          rgba[i+2]=Math.round(rgba[i+2]*0.8+gray*0.2);
          rgba[i+3]=Math.min(255,rgba[i+3]*0.9+alpha*0.1);
        }
      }
    }
  }

  // Enhanced crossing lines (multiple styles)
  for (let l=0;l<5;l++){
    const ly=PAD_Y/3+Math.floor(rng()*(H-PAD_Y*0.66));
    const style=l%2; // 0=thin, 1=thick
    const lr=Math.floor(rng()*90)+80,lg=Math.floor(rng()*90)+80,lb=Math.floor(rng()*110)+110;
    const la=3.5+rng()*3.5,lph=rng()*Math.PI*2,lld=70+rng()*35;
    const thickness=style===0?1:2;
    for (let px=0;px<W;px++){
      const py=Math.round(ly+la*Math.sin(2*Math.PI*px/lld+lph));
      for (let t=-thickness;t<=thickness;t++) if (py+t>=0&&py+t<H){
        const i=((py+t)*W+px)*4;
        rgba[i]=Math.min(255,rgba[i]*0.7+lr*0.3);
        rgba[i+1]=Math.min(255,rgba[i+1]*0.7+lg*0.3);
        rgba[i+2]=Math.min(255,rgba[i+2]*0.7+lb*0.3);
        rgba[i+3]=Math.min(255,rgba[i+3]*0.9+Math.floor(200*0.1));
      }
    }
  }

  return encodePng(W,H,rgba);
}
