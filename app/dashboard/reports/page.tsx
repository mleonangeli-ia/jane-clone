import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const tenantId = session!.user.id;
  const { period: rawPeriod } = await searchParams;

  const period = rawPeriod === "week" || rawPeriod === "3months" ? rawPeriod : "month";

  const days = period === "week" ? 7 : period === "3months" ? 90 : 30;
  const now = new Date();
  const to = now;
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const prevFrom = new Date(from.getTime() - days * 24 * 60 * 60 * 1000);
  const prevTo = from;

  const [appointments, prevAppointments, allClients] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        tenantId,
        status: { notIn: ["CANCELLED"] },
        startTime: { gte: from, lte: to },
      },
      include: { service: true, client: true },
    }),
    prisma.appointment.findMany({
      where: {
        tenantId,
        status: { notIn: ["CANCELLED"] },
        startTime: { gte: prevFrom, lte: prevTo },
      },
      include: { service: true, client: true },
    }),
    prisma.client.findMany({ where: { tenantId } }),
  ]);

  const totalRevenue = appointments
    .filter((a) => a.paymentStatus === "PAID")
    .reduce((sum, a) => sum + a.service.price, 0);

  const prevRevenue = prevAppointments
    .filter((a) => a.paymentStatus === "PAID")
    .reduce((sum, a) => sum + a.service.price, 0);

  const revenueChange =
    prevRevenue === 0
      ? totalRevenue > 0
        ? 100
        : 0
      : Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100);

  const totalAppointments = appointments.length;

  const byStatus = appointments.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  const completedCount = byStatus["COMPLETED"] ?? 0;
  const noShowCount = byStatus["NO_SHOW"] ?? 0;
  const noShowRate =
    completedCount + noShowCount > 0
      ? Math.round((noShowCount / (completedCount + noShowCount)) * 100)
      : 0;

  const newClients = appointments.filter((a) => {
    const created = new Date(a.client.createdAt);
    return created >= from && created <= to;
  }).length;

  const serviceCount = appointments.reduce<Record<string, { name: string; count: number }>>(
    (acc, a) => {
      if (!acc[a.serviceId]) acc[a.serviceId] = { name: a.service.name, count: 0 };
      acc[a.serviceId].count += 1;
      return acc;
    },
    {}
  );
  const serviceList = Object.values(serviceCount).sort((a, b) => b.count - a.count);
  const topService = serviceList[0]?.name ?? "—";

  const clientMap = appointments.reduce<
    Record<string, { name: string; email: string; count: number; revenue: number }>
  >((acc, a) => {
    if (!acc[a.clientId]) {
      acc[a.clientId] = { name: a.client.name, email: a.client.email, count: 0, revenue: 0 };
    }
    acc[a.clientId].count += 1;
    if (a.paymentStatus === "PAID") acc[a.clientId].revenue += a.service.price;
    return acc;
  }, {});
  const top5Clients = Object.values(clientMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const revenueByDay = appointments
    .filter((a) => a.paymentStatus === "PAID")
    .reduce<Record<string, number>>((acc, a) => {
      const day = format(new Date(a.startTime), "yyyy-MM-dd");
      acc[day] = (acc[day] ?? 0) + a.service.price;
      return acc;
    }, {});

  const allDays: { date: string; revenue: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(from.getTime() + i * 24 * 60 * 60 * 1000);
    const key = format(d, "yyyy-MM-dd");
    allDays.push({ date: key, revenue: revenueByDay[key] ?? 0 });
  }

  const maxRevenue = Math.max(...allDays.map((d) => d.revenue), 0);

  const periods = [
    { key: "week", label: "Semana" },
    { key: "month", label: "Mes" },
    { key: "3months", label: "3 meses" },
  ];

  const statusConfig: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
    CONFIRMED: { label: "Confirmado", color: "bg-blue-100 text-blue-700" },
    COMPLETED: { label: "Completado", color: "bg-green-100 text-green-700" },
    NO_SHOW: { label: "No asistió", color: "bg-red-100 text-red-700" },
    CANCELLED: { label: "Cancelado", color: "bg-gray-100 text-gray-600" },
  };

  const totalServiceCount = serviceList.reduce((s, sv) => s + sv.count, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
          {periods.map((p) => (
            <Link
              key={p.key}
              href={`/dashboard/reports?period=${p.key}`}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                period === p.key
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Revenue */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Ingresos</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{formatPrice(totalRevenue)}</p>
          <div className="mt-2 flex items-center gap-1.5">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                revenueChange >= 0
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {revenueChange >= 0 ? "+" : ""}
              {revenueChange}%
            </span>
            <span className="text-xs text-gray-400">vs período anterior</span>
          </div>
        </div>

        {/* Appointments */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Total turnos
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{totalAppointments}</p>
          <p className="mt-2 text-xs text-gray-400">En el período seleccionado</p>
        </div>

        {/* No-show rate */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Tasa de no-show
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{noShowRate}%</p>
          <p className="mt-2 text-xs text-gray-400">
            {noShowCount} de {completedCount + noShowCount} completados
          </p>
        </div>

        {/* New clients */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Clientes nuevos
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{newClients}</p>
          <p className="mt-2 text-xs text-gray-400">Servicio más pedido: {topService}</p>
        </div>
      </div>

      {/* Revenue chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Ingresos por día</h2>
        {maxRevenue === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-gray-400">
            Sin ingresos en este período
          </div>
        ) : (
          <div className="flex items-end gap-1 h-32 overflow-x-auto pb-6">
            {allDays.map((d) => {
              const height = maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0;
              return (
                <div key={d.date} className="flex flex-col items-center flex-1 min-w-[8px]">
                  <div
                    className="w-full rounded-t bg-indigo-500 transition-all"
                    style={{ height: `${height}%` }}
                    title={`${d.date}: ${formatPrice(d.revenue)}`}
                  />
                  {days <= 30 && (
                    <span className="mt-1 text-[9px] text-gray-400 rotate-0 whitespace-nowrap">
                      {d.date.slice(8)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Status breakdown */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Desglose por estado</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(statusConfig).map(([status, cfg]) => (
            <div key={status} className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${cfg.color}`}>
              <span className="text-sm font-medium">{cfg.label}</span>
              <span className="text-sm font-bold">{byStatus[status] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top 5 clients */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Top 5 clientes</h2>
          {top5Clients.length === 0 ? (
            <p className="text-sm text-gray-400">Sin turnos en este período</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  <th className="pb-2">Cliente</th>
                  <th className="pb-2 text-center">Turnos</th>
                  <th className="pb-2 text-right">Cobrado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {top5Clients.map((c) => (
                  <tr key={c.email}>
                    <td className="py-2">
                      <p className="font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.email}</p>
                    </td>
                    <td className="py-2 text-center text-gray-700">{c.count}</td>
                    <td className="py-2 text-right font-medium text-gray-900">
                      {formatPrice(c.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Services breakdown */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Servicios más demandados</h2>
          {serviceList.length === 0 ? (
            <p className="text-sm text-gray-400">Sin turnos en este período</p>
          ) : (
            <div className="space-y-3">
              {serviceList.map((s) => {
                const pct = totalServiceCount > 0 ? (s.count / totalServiceCount) * 100 : 0;
                return (
                  <div key={s.name} className="flex items-center gap-3">
                    <span className="w-32 text-sm truncate text-gray-700">{s.name}</span>
                    <div className="flex-1 rounded-full bg-gray-100 h-2">
                      <div
                        className="rounded-full bg-indigo-500 h-2"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-8 text-right">{s.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
