"use client";

type Item = { name: string; value: number; color: string };

export function PaymentStatusChart({ data }: { data: Item[] }) {
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="space-y-3 py-2">
      {data.map((d, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium" style={{ color: "var(--text)" }}>{d.name}</span>
            <span className="tabular-nums font-bold" style={{ color: d.color }}>{d.value}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
