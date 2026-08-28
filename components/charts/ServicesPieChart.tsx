"use client";

const COLORS = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe"];

type Item = { name: string; count: number };

export function ServicesPieChart({ data }: { data: Item[] }) {
  if (!data.length) return null;

  const total = data.reduce((s, d) => s + d.count, 0);
  const R = 70, cx = 90, cy = 90;
  const slices = data.reduce(
    (acc, d, i) => {
      const angle = (d.count / total) * 2 * Math.PI;
      const x1 = cx + R * Math.cos(acc.angle);
      const y1 = cy + R * Math.sin(acc.angle);
      const endAngle = acc.angle + angle;
      const x2 = cx + R * Math.cos(endAngle);
      const y2 = cy + R * Math.sin(endAngle);
      const large = angle > Math.PI ? 1 : 0;
      return {
        angle: endAngle,
        slices: [...acc.slices, {
          path: `M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`,
          color: COLORS[i % COLORS.length],
          ...d,
        }],
      };
    },
    { angle: -Math.PI / 2, slices: [] as Array<Item & { path: string; color: string }> },
  ).slices;

  // Donut hole
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 180 180" style={{ width: 140, height: 140, flexShrink: 0 }}>
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="var(--bg-card)" strokeWidth="2"/>
        ))}
        {/* Hole */}
        <circle cx={cx} cy={cy} r={40} fill="var(--bg-card)"/>
        <text x={cx} y={cy - 5} textAnchor="middle" fontSize="18" fontWeight="800" fill="var(--text)">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="var(--text-faint)">TURNOS</text>
      </svg>

      <div className="flex flex-col gap-1.5 min-w-0">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs min-w-0">
            <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }}/>
            <span className="truncate font-medium" style={{ color: "var(--text)" }}>{s.name}</span>
            <span className="shrink-0 tabular-nums" style={{ color: "var(--text-faint)" }}>{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
