"use client";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

type Point = { date: string; revenue: number };

function fmt(n: number) {
  if (n === 0) return "$0";
  if (n >= 100000) return `$${(n / 100000).toFixed(0)}k`;
  return `$${(n / 100).toFixed(0)}`;
}

export function RevenueChart({ data, period }: { data: Point[]; period: string }) {
  if (!data.length) return <div className="h-[220px] flex items-center justify-center text-sm" style={{ color: "var(--text-faint)" }}>Sin datos</div>;

  const W = 700, H = 200, PAD = { t: 10, r: 10, b: 30, l: 50 };
  const maxVal = Math.max(...data.map(d => d.revenue), 1);
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;

  const pts = data.map((d, i) => ({
    x: PAD.l + (i / (data.length - 1 || 1)) * cW,
    y: PAD.t + cH - (d.revenue / maxVal) * cH,
    ...d,
  }));

  const polyline = pts.map(p => `${p.x},${p.y}`).join(" ");
  const area = [
    `${pts[0].x},${PAD.t + cH}`,
    ...pts.map(p => `${p.x},${p.y}`),
    `${pts[pts.length - 1].x},${PAD.t + cH}`,
  ].join(" ");

  // Tick positions
  const step = period === "week" ? 1 : period === "month" ? 5 : 15;
  const ticks = pts.filter((_, i) => i % step === 0 || i === pts.length - 1);

  // Y axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    y: PAD.t + cH - f * cH,
    label: fmt(maxVal * f),
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 220 }}>
      <defs>
        <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#2563eb" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0"/>
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={PAD.l} x2={W - PAD.r} y1={t.y} y2={t.y} stroke="var(--border)" strokeDasharray="3 3" strokeWidth="0.8"/>
          <text x={PAD.l - 6} y={t.y + 4} textAnchor="end" fontSize="10" fill="var(--text-faint)">{t.label}</text>
        </g>
      ))}

      {/* Area */}
      <polygon points={area} fill="url(#rGrad)"/>

      {/* Line */}
      <polyline points={polyline} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Dots on data points > 0 */}
      {pts.filter(p => p.revenue > 0).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#2563eb" stroke="white" strokeWidth="1.5"/>
      ))}

      {/* X axis ticks */}
      {ticks.map((p, i) => (
        <text key={i} x={p.x} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--text-faint)">
          {format(parseISO(p.date), "d MMM", { locale: es })}
        </text>
      ))}
    </svg>
  );
}
