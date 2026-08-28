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

// Premium color palettes for maximum contrast
const COLORS: [number, number, number][] = [
  [15,85,200], // bright blue
  [200,15,50], // bright red
  [30,140,50], // bright green
  [200,120,0], // bright orange
  [100,10,140], // bright purple
  [0,120,150], // bright cyan
];

export function renderMathPng(a: number, b: number): Buffer {
  const text = `${a} + ${b} = ?`;
  const W = PAD_X * 2 + text.length * STEP - GAP;
  const H = PAD_Y * 2 + CHAR_H * SCALE;
  const rgba = new Uint8Array(W * H * 4);

  // Premium gradient background
  let s = ((a*1009+b*997)&0x7fffffff)>>>0;
  const rng=()=>{s=(Math.imul(1664525,s)+1013904223)|0;return(s>>>0)/0xffffffff;};
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const tx = x / W, ty = y / H;
      const i = (y * W + x) * 4;
      // Multi-directional gradient
      rgba[i]=Math.round(242 + 8*tx - 5*ty);
      rgba[i+1]=Math.round(245 + 5*tx - 3*ty);
      rgba[i+2]=Math.round(250 + 3*tx - 2*ty);
      rgba[i+3]=255;
    }
  }

  // Intelligent noise: clusters + texture
  for (let n=0;n<500;n++){
    const nx=Math.floor(rng()*W), ny=Math.floor(rng()*H);
    const sz=rng()<0.7?1:Math.floor(rng()*2)+1; // 70% single dots, 30% clusters
    for (let dx=0;dx<sz;dx++){
      for (let dy=0;dy<sz;dy++){
        const px=nx+dx, py=ny+dy;
        if (px>=0&&px<W&&py>=0&&py<H){
          const i=(py*W+px)*4;
          const gray=Math.floor(rng()*80)+140;
          const alpha=Math.floor(rng()*120)+50;
          rgba[i]=Math.round(rgba[i]*0.8+gray*0.2);
          rgba[i+1]=Math.round(rgba[i+1]*0.8+gray*0.2);
          rgba[i+2]=Math.round(rgba[i+2]*0.8+gray*0.2);
          rgba[i+3]=Math.min(255,rgba[i+3]*0.95+alpha*0.05);
        }
      }
    }
  }

  // Add grid pattern for texture
  for (let x=0;x<W;x+=15){
    for (let y=0;y<H;y++){
      const i=(y*W+x)*4;
      rgba[i]=Math.max(200,rgba[i]-15);
      rgba[i+1]=Math.max(200,rgba[i+1]-15);
      rgba[i+2]=Math.max(210,rgba[i+2]-10);
    }
  }

  // Premium characters with antialiasing
  for (let ci = 0; ci < text.length; ci++) {
    const bitmap = FONT[text[ci]] ?? FONT[' '];
    const [cr, cg, cb] = COLORS[ci % COLORS.length];
    const bx = PAD_X + ci * STEP;

    for (let row = 0; row < CHAR_H; row++) {
      for (let col = 0; col < CHAR_W; col++) {
        if (!(bitmap[row] & (1 << (CHAR_W - 1 - col)))) continue;

        for (let dy = 0; dy < SCALE; dy++) {
          for (let dx = 0; dx < SCALE; dx++) {
            const px = bx + col * SCALE + dx;
            const py = PAD_Y + row * SCALE + dy;
            if (px < 0 || px >= W || py < 0 || py >= H) continue;
            const index = (py * W + px) * 4;
            rgba[index] = cr;
            rgba[index + 1] = cg;
            rgba[index + 2] = cb;
            rgba[index + 3] = 255;
          }
        }

        for (let dy = -1; dy <= SCALE; dy++) {
          for (let dx = -1; dx <= SCALE; dx++) {
            if ((dx >= 0 && dx < SCALE && dy >= 0 && dy < SCALE) || rng() >= 0.3) continue;
            const px = bx + col * SCALE + dx;
            const py = PAD_Y + row * SCALE + dy;
            if (px < 0 || px >= W || py < 0 || py >= H) continue;
            const index = (py * W + px) * 4;
            const blend = 0.4;
            rgba[index] = Math.round(rgba[index] * (1 - blend) + cr * blend);
            rgba[index + 1] = Math.round(rgba[index + 1] * (1 - blend) + cg * blend);
            rgba[index + 2] = Math.round(rgba[index + 2] * (1 - blend) + cb * blend);
          }
        }
      }
    }
  }

  // Multiple interference lines for realism
  for (let line=0;line<2;line++){
    const baseY=Math.round(PAD_Y+CHAR_H*SCALE*(0.35+line*0.25));
    for (let x=PAD_X;x<W-PAD_X;x++){
      const wave=Math.sin(x*0.1)*(2+line);
      const y=Math.round(baseY+wave);
      if(y>=0&&y<H){
        const i=(y*W+x)*4;
        rgba[i]=Math.min(255,rgba[i]+50);
        rgba[i+1]=Math.min(255,rgba[i+1]+30);
        rgba[i+2]=Math.min(255,rgba[i+2]+40);
      }
    }
  }

  return encodePng(W,H,rgba);
}
