"use client";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

type Point = { date: string; total: number };

export function ClientGrowthChart({ data, period }: { data: Point[]; period: string }) {
  if (!data.length) return null;

  const W = 700, H = 160, PAD = { t: 10, r: 10, b: 30, l: 40 };
  const maxVal = Math.max(...data.map(d => d.total), 1);
  const minVal = Math.min(...data.map(d => d.total), 0);
  const range  = maxVal - minVal || 1;
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;

  const pts = data.map((d, i) => ({
    x: PAD.l + (i / (data.length - 1 || 1)) * cW,
    y: PAD.t + cH - ((d.total - minVal) / range) * cH,
    ...d,
  }));

  const polyline  = pts.map(p => `${p.x},${p.y}`).join(" ");
  const area = [
    `${pts[0].x},${PAD.t + cH}`,
    ...pts.map(p => `${p.x},${p.y}`),
    `${pts[pts.length - 1].x},${PAD.t + cH}`,
  ].join(" ");

  const step = period === "week" ? 1 : period === "month" ? 5 : 15;
  const ticks = pts.filter((_, i) => i % step === 0 || i === pts.length - 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
      <defs>
        <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#2563eb" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0"/>
        </linearGradient>
      </defs>

      <polygon points={area} fill="url(#cGrad)"/>
      <polyline points={polyline} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Last point dot */}
      {pts.length > 0 && (
        <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="4" fill="#2563eb" stroke="white" strokeWidth="2"/>
      )}

      {/* Y labels */}
      {[0, 0.5, 1].map((f, i) => {
        const val = Math.round(minVal + f * range);
        const y   = PAD.t + cH - f * cH;
        return (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="var(--border)" strokeDasharray="3 3" strokeWidth="0.8"/>
            <text x={PAD.l - 5} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-faint)">{val}</text>
          </g>
        );
      })}

      {ticks.map((p, i) => (
        <text key={i} x={p.x} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--text-faint)">
          {format(parseISO(p.date), "d MMM", { locale: es })}
        </text>
      ))}
    </svg>
  );
}
