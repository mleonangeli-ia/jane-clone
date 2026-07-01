import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, DollarSign, Clock, ArrowRight, TrendingUp } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { startOfDay, endOfDay, format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { AppointmentActions } from "@/components/appointments/AppointmentActions";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const tenantId = session!.user.id;
  const today = new Date();
  const yesterday = subDays(today, 1);

  const [todayAppointments, totalClients, pendingPayments, totalAppointments, yesterdayCount, nextAppointments] =
    await Promise.all([
      prisma.appointment.findMany({
        where: {
          tenantId,
          startTime: { gte: startOfDay(today), lte: endOfDay(today) },
          status: { notIn: ["CANCELLED"] },
        },
        include: { client: true, service: true },
        orderBy: { startTime: "asc" },
      }),
      prisma.client.count({ where: { tenantId } }),
      prisma.appointment.count({
        where: { tenantId, paymentStatus: "UNPAID", status: "CONFIRMED" },
      }),
      prisma.appointment.count({ where: { tenantId, status: { notIn: ["CANCELLED"] } } }),
      prisma.appointment.count({
        where: {
          tenantId,
          startTime: { gte: startOfDay(yesterday), lte: endOfDay(yesterday) },
          status: { notIn: ["CANCELLED"] },
        },
      }),
      prisma.appointment.findMany({
        where: {
          tenantId,
          startTime: { gt: new Date() },
          status: { notIn: ["CANCELLED"] },
        },
        include: { client: true, service: true },
        orderBy: { startTime: "asc" },
        take: 3,
      }),
    ]);

  const todayRevenue = todayAppointments
    .filter((a) => a.paymentStatus === "PAID")
    .reduce((sum, a) => sum + a.service.price, 0);

  const hour = today.getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  const todayVsYesterday = todayAppointments.length - yesterdayCount;

  return (
    <div className="space-y-8">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}, {session!.user.name?.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 capitalize text-gray-500">
            {format(today, "EEEE d 'de' MMMM", { locale: es })}
          </p>
        </div>
        <Link href="/dashboard/appointments">
          <button className="hidden items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 sm:flex">
            Ver agenda completa
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </Link>
      </div>

      {/* ── Stat cards ─────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Calendar}
          label="Turnos hoy"
          value={todayAppointments.length}
          sub={`${yesterdayCount} ayer`}
          delta={todayVsYesterday}
          gradient="from-indigo-500 to-violet-600"
          lightBg="bg-indigo-50"
          lightText="text-indigo-600"
        />
        <StatCard
          icon={Users}
          label="Clientes"
          value={totalClients}
          sub={`${totalAppointments} turnos totales`}
          gradient="from-sky-500 to-cyan-600"
          lightBg="bg-sky-50"
          lightText="text-sky-600"
        />
        <StatCard
          icon={DollarSign}
          label="Cobrado hoy"
          value={formatPrice(todayRevenue)}
          sub="ingresos del día"
          gradient="from-emerald-500 to-teal-600"
          lightBg="bg-emerald-50"
          lightText="text-emerald-600"
        />
        <StatCard
          icon={Clock}
          label="Cobros pendientes"
          value={pendingPayments}
          sub="turnos sin cobrar"
          gradient="from-orange-500 to-amber-600"
          lightBg="bg-orange-50"
          lightText="text-orange-600"
          alert={pendingPayments > 0}
        />
      </div>

      {/* ── Two-column layout ───────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Today's schedule — 2/3 */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100">
                <Calendar className="h-3.5 w-3.5 text-indigo-600" />
              </span>
              Agenda de hoy
              <span className="ml-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                {todayAppointments.length}
              </span>
            </h2>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
                <Calendar className="h-7 w-7 text-gray-300" />
              </div>
              <p className="font-semibold text-gray-400">Sin turnos hoy</p>
              <p className="mt-1 text-sm text-gray-300">Los nuevos turnos aparecerán acá</p>
              <Link href={`/book/${session!.user.slug}`} target="_blank" className="mt-4">
                <button className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Compartir link de reservas
                </button>
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              {todayAppointments.map((apt, i) => (
                <div
                  key={apt.id}
                  className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50/50 ${
                    i < todayAppointments.length - 1 ? "border-b border-gray-50" : ""
                  }`}
                >
                  {/* Time block */}
                  <div className="flex w-14 shrink-0 flex-col items-center rounded-xl py-2" style={{ background: `${apt.service.color}12` }}>
                    <span className="text-sm font-bold" style={{ color: apt.service.color }}>
                      {format(apt.startTime, "HH:mm")}
                    </span>
                    <span className="text-[10px] text-gray-400">{format(apt.endTime, "HH:mm")}</span>
                  </div>

                  {/* Color bar */}
                  <div className="h-10 w-1 shrink-0 rounded-full" style={{ backgroundColor: apt.service.color }} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-semibold text-gray-900">{apt.client.name}</p>
                    <p className="truncate text-sm text-gray-400">{apt.service.name}</p>
                  </div>

                  {/* Right */}
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="hidden text-sm font-semibold text-gray-600 sm:block">
                      {formatPrice(apt.service.price)}
                    </span>
                    <PaymentBadge status={apt.paymentStatus} />
                    <StatusBadge status={apt.status} />
                    <AppointmentActions
                      appointmentId={apt.id}
                      currentStatus={apt.status}
                      currentPaymentStatus={apt.paymentStatus}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar — 1/3 */}
        <div className="space-y-5">
          {/* Upcoming */}
          <div>
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-100">
                <TrendingUp className="h-3.5 w-3.5 text-violet-600" />
              </span>
              Próximos turnos
            </h2>
            {nextAppointments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-400">
                Sin próximos turnos
              </div>
            ) : (
              <div className="space-y-2">
                {nextAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white" style={{ backgroundColor: apt.service.color }}>
                      {apt.client.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{apt.client.name}</p>
                      <p className="text-xs text-gray-400">
                        {format(apt.startTime, "d MMM · HH:mm", { locale: es })}
                      </p>
                    </div>
                    <StatusBadge status={apt.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick link */}
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-5">
            <p className="text-sm font-semibold text-indigo-900">Tu link de reservas</p>
            <p className="mt-1 text-xs text-indigo-600">Compartilo con tus pacientes</p>
            <Link href={`/book/${session!.user.slug}`} target="_blank">
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-indigo-100">
                <span className="flex-1 truncate text-xs font-medium text-indigo-700">
                  /book/{session!.user.slug}
                </span>
                <ArrowRight className="h-3 w-3 shrink-0 text-indigo-400" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, sub, gradient, lightBg, lightText, delta, alert,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub: string;
  gradient: string;
  lightBg: string;
  lightText: string;
  delta?: number;
  alert?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 shadow-sm transition-all hover:shadow-md ${alert ? "border-2 border-orange-200 bg-orange-50/30" : "border border-gray-100 bg-white"}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">{value}</p>
          <p className="mt-1 text-xs text-gray-400">{sub}</p>
          {delta !== undefined && (
            <p className={`mt-1 text-xs font-medium ${delta > 0 ? "text-emerald-600" : delta < 0 ? "text-red-500" : "text-gray-400"}`}>
              {delta > 0 ? `+${delta}` : delta} vs ayer
            </p>
          )}
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
    PENDING:   { label: "Pendiente",  variant: "warning" },
    CONFIRMED: { label: "Confirmado", variant: "success" },
    CANCELLED: { label: "Cancelado",  variant: "destructive" },
    COMPLETED: { label: "Completado", variant: "secondary" },
    NO_SHOW:   { label: "No asistió", variant: "destructive" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "secondary" };
  return <Badge variant={variant}>{label}</Badge>;
}

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
    UNPAID:   { label: "Sin pagar",   variant: "warning" },
    PAID:     { label: "Pagado",      variant: "success" },
    REFUNDED: { label: "Reembolsado", variant: "secondary" },
    FAILED:   { label: "Fallido",     variant: "destructive" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "secondary" };
  return <Badge variant={variant}>{label}</Badge>;
}
