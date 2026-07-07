import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { TrendingUp, TrendingDown, Minus, Users, Calendar, DollarSign, BarChart2 } from "lucide-react";
import { RevenueChart }      from "@/components/charts/RevenueChart";
import { ServicesPieChart }  from "@/components/charts/ServicesPieChart";
import { WeekdayChart }      from "@/components/charts/WeekdayChart";
import { PaymentStatusChart } from "@/components/charts/PaymentStatusChart";
import { ClientGrowthChart } from "@/components/charts/ClientGrowthChart";

const DAY_LABELS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const tenantId = session!.user.id;
  const { period: rawPeriod } = await searchParams;
  const period = rawPeriod === "week" || rawPeriod === "3months" ? rawPeriod : "month";

  const days     = period === "week" ? 7 : period === "3months" ? 90 : 30;
  const now      = new Date();
  const from     = subDays(now, days);
  const prevFrom = subDays(from, days);

  const [appointments, prevAppointments, allClients] = await Promise.all([
    prisma.appointment.findMany({
      where: { tenantId, startTime: { gte: from, lte: now } },
      include: { service: true, client: true },
    }),
    prisma.appointment.findMany({
      where: { tenantId, status: { notIn: ["CANCELLED"] }, startTime: { gte: prevFrom, lte: from } },
      include: { service: true },
    }),
    prisma.client.findMany({ where: { tenantId }, orderBy: { createdAt: "asc" } }),
  ]);

  const active = appointments.filter(a => a.status !== "CANCELLED");

  // ── KPIs ──────────────────────────────────────────────────────
  const totalRevenue  = active.filter(a => a.paymentStatus === "PAID").reduce((s, a) => s + a.service.price, 0);
  const prevRevenue   = prevAppointments.filter(a => a.paymentStatus === "PAID").reduce((s, a) => s + a.service.price, 0);
  const revenueChange = prevRevenue === 0 ? (totalRevenue > 0 ? 100 : 0) : Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100);

  const totalApts   = active.length;
  const prevApts    = prevAppointments.length;
  const aptsChange  = prevApts === 0 ? (totalApts > 0 ? 100 : 0) : Math.round(((totalApts - prevApts) / prevApts) * 100);

  const newClients  = allClients.filter(c => new Date(c.createdAt) >= from).length;
  const completedCount = appointments.filter(a => a.status === "COMPLETED").length;
  const noShowCount    = appointments.filter(a => a.status === "NO_SHOW").length;
  const noShowRate  = completedCount + noShowCount > 0
    ? Math.round(noShowCount / (completedCount + noShowCount) * 100) : 0;

  // ── Revenue by day ────────────────────────────────────────────
  const revenueByDay = active
    .filter(a => a.paymentStatus === "PAID")
    .reduce<Record<string, number>>((acc, a) => {
      const key = format(a.startTime, "yyyy-MM-dd");
      acc[key] = (acc[key] ?? 0) + a.service.price;
      return acc;
    }, {});

  const revenueData = Array.from({ length: days }, (_, i) => {
    const d   = subDays(now, days - 1 - i);
    const key = format(d, "yyyy-MM-dd");
    return { date: key, revenue: revenueByDay[key] ?? 0 };
  });

  // ── Services breakdown ────────────────────────────────────────
  const serviceCounts = active.reduce<Record<string, { name: string; count: number }>>((acc, a) => {
    if (!acc[a.serviceId]) acc[a.serviceId] = { name: a.service.name, count: 0 };
    acc[a.serviceId].count++;
    return acc;
  }, {});
  const servicesData = Object.values(serviceCounts).sort((a, b) => b.count - a.count).slice(0, 6);

  // ── By weekday ────────────────────────────────────────────────
  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
  active.forEach(a => { weekdayCounts[a.startTime.getDay()]++; });
  const weekdayData = DAY_LABELS.map((day, i) => ({ day, count: weekdayCounts[i] }));

  // ── Payment status ────────────────────────────────────────────
  const paymentData = [
    { name: "Pagado",     value: active.filter(a => a.paymentStatus === "PAID").length,     color: "#2563eb" },
    { name: "Sin pagar",  value: active.filter(a => a.paymentStatus === "UNPAID").length,   color: "#bfdbfe" },
  ].filter(d => d.value > 0);

  // ── Client growth (cumulative) ────────────────────────────────
  const clientsByDay = allClients.reduce<Record<string, number>>((acc, c) => {
    const key = format(new Date(c.createdAt), "yyyy-MM-dd");
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  let cumulative = allClients.filter(c => new Date(c.createdAt) < from).length;
  const clientGrowthData = Array.from({ length: days }, (_, i) => {
    const d   = subDays(now, days - 1 - i);
    const key = format(d, "yyyy-MM-dd");
    cumulative += clientsByDay[key] ?? 0;
    return { date: key, total: cumulative };
  });

  // ── Top clients ───────────────────────────────────────────────
  const clientMap = active.reduce<Record<string, { name: string; count: number; revenue: number }>>((acc, a) => {
    if (!acc[a.clientId]) acc[a.clientId] = { name: a.client.name, count: 0, revenue: 0 };
    acc[a.clientId].count++;
    if (a.paymentStatus === "PAID") acc[a.clientId].revenue += a.service.price;
    return acc;
  }, {});
  const top5Clients = Object.values(clientMap).sort((a, b) => b.count - a.count).slice(0, 5);

  const periods = [
    { key: "week", label: "Semana" },
    { key: "month", label: "Mes" },
    { key: "3months", label: "3 meses" },
  ];

  return (
    <div className="space-y-8 animate-fade-up">

      {/* Header + period selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl" style={{ color: "var(--text)", letterSpacing: "-0.03em" }}>
            Estadísticas
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
            Últim{period === "week" ? "a semana" : period === "month" ? "os 30 días" : "os 90 días"}
          </p>
        </div>
        <div className="flex rounded-xl p-1" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
          {periods.map(p => (
            <Link key={p.key} href={`?period=${p.key}`}>
              <span
                className="inline-block rounded-lg px-4 py-1.5 text-sm font-medium transition-all"
                style={{
                  backgroundColor: period === p.key ? "var(--bg-card)" : "transparent",
                  color: period === p.key ? "var(--text)" : "var(--text-muted)",
                  boxShadow: period === p.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {p.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── KPI cards ─────────────────────────────────────────── */}
      <div className="stagger-children grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={DollarSign} label="Ingresos" value={formatPrice(totalRevenue)} change={revenueChange} accent="#2563eb" />
        <KpiCard icon={Calendar}   label="Turnos"   value={String(totalApts)}         change={aptsChange}    accent="#3b82f6" />
        <KpiCard icon={Users}      label="Nuevos clientes" value={String(newClients)}  accent="#60a5fa" />
        <KpiCard icon={BarChart2}  label="Tasa no-show"    value={`${noShowRate}%`}    accent={noShowRate > 15 ? "#ef4444" : "#93c5fd"} alert={noShowRate > 15} />
      </div>

      {/* ── Main chart: revenue ───────────────────────────────── */}
      <ChartCard title="Ingresos por día" subtitle={`Total: ${formatPrice(totalRevenue)}`}>
        <RevenueChart data={revenueData} period={period} />
      </ChartCard>

      {/* ── Two columns ──────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Turnos por servicio" subtitle={`${totalApts} total`}>
          {servicesData.length > 0
            ? <ServicesPieChart data={servicesData} />
            : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Turnos por día de la semana" subtitle="Distribución histórica">
          <WeekdayChart data={weekdayData} />
        </ChartCard>
      </div>

      {/* ── Two columns ──────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Estado de cobro" subtitle="Turnos activos">
          {paymentData.length > 0
            ? <PaymentStatusChart data={paymentData} />
            : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Crecimiento de clientes" subtitle={`${allClients.length} total`}>
          <ClientGrowthChart data={clientGrowthData} period={period} />
        </ChartCard>
      </div>

      {/* ── Top clients table ─────────────────────────────────── */}
      {top5Clients.length > 0 && (
        <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}>
          <div className="border-b px-5 py-4 flex items-center justify-between" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }}>
            <p className="font-semibold" style={{ color: "var(--text)" }}>Top pacientes</p>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>por cantidad de turnos</p>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {top5Clients.map((c, i) => (
              <div key={c.name} className="flex items-center gap-4 px-5 py-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: i === 0 ? "#2563eb" : i === 1 ? "#3b82f6" : "#93c5fd" }}>
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-medium truncate" style={{ color: "var(--text)" }}>{c.name}</span>
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>{c.count} turno{c.count !== 1 ? "s" : ""}</span>
                {c.revenue > 0 && (
                  <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{formatPrice(c.revenue)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, change, accent, alert }: {
  icon: React.ElementType;
  label: string;
  value: string;
  change?: number;
  accent: string;
  alert?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-4 transition-all hover:-translate-y-0.5 sm:p-5"
         style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ backgroundColor: accent }} />
      <div className="flex items-start justify-between gap-2 pt-1">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest sm:text-xs" style={{ color: "var(--text-faint)" }}>{label}</p>
          <p className="mt-2 text-2xl font-black sm:text-3xl" style={{ color: "var(--text)", letterSpacing: "-0.03em" }}>{value}</p>
          {change !== undefined && (
            <div className="mt-1 flex items-center gap-1">
              {change > 0 ? <TrendingUp className="h-3 w-3 text-emerald-500" /> :
               change < 0 ? <TrendingDown className="h-3 w-3 text-red-400" /> :
               <Minus className="h-3 w-3" style={{ color: "var(--text-faint)" }} />}
              <span className={`text-xs font-semibold ${change > 0 ? "text-emerald-500" : change < 0 ? "text-red-400" : ""}`}
                    style={change === 0 ? { color: "var(--text-faint)" } : undefined}>
                {change > 0 ? "+" : ""}{change}% vs anterior
              </span>
            </div>
          )}
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
             style={{ backgroundColor: `${accent}18` }}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: accent }} />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}>
      <div className="border-b px-5 py-4" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-subtle)" }}>
        <p className="font-semibold" style={{ color: "var(--text)" }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>{subtitle}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-40 items-center justify-center text-sm" style={{ color: "var(--text-faint)" }}>
      Sin datos para este período
    </div>
  );
}
