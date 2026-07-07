"use client";

type Point = { day: string; count: number };

export function WeekdayChart({ data }: { data: Point[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const W = 500, H = 160, PAD = { t: 10, r: 10, b: 30, l: 30 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;
  const barW = (cW / data.length) * 0.55;
  const gap  = cW / data.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
      {data.map((d, i) => {
        const bH  = (d.count / max) * cH;
        const x   = PAD.l + i * gap + (gap - barW) / 2;
        const y   = PAD.t + cH - bH;
        const isMax = d.count === max;
        return (
          <g key={i}>
            <rect x={x} y={PAD.t + cH} width={barW} height={0.5} fill="var(--border)"/>
            <rect
              x={x} y={y} width={barW} height={bH}
              rx={4} ry={4}
              fill={isMax ? "#2563eb" : "#bfdbfe"}
            />
            {d.count > 0 && (
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="10" fontWeight={isMax ? "700" : "400"}
                    fill={isMax ? "#2563eb" : "var(--text-muted)"}>
                {d.count}
              </text>
            )}
            <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--text-faint)">{d.day}</text>
          </g>
        );
      })}
    </svg>
  );
}
