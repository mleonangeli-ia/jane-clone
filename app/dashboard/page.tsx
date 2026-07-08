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
        take: 4,
      }),
    ]);

  const todayRevenue = todayAppointments
    .filter((a) => a.paymentStatus === "PAID")
    .reduce((sum, a) => sum + a.service.price, 0);

  const hour = today.getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const todayVsYesterday = todayAppointments.length - yesterdayCount;

  return (
    <div className="space-y-7 animate-fade-up">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl" style={{ color: "var(--text)", letterSpacing: "-0.03em" }}>
            {greeting}, {session!.user.name?.split(" ")[0]} 👋
          </h1>
          <p className="mt-0.5 capitalize text-sm" style={{ color: "var(--text-muted)" }}>
            {format(today, "EEEE d 'de' MMMM", { locale: es })}
          </p>
        </div>
        <Link href="/dashboard/appointments">
          <button
            className="hidden items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition-all sm:flex"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
          >
            Agenda completa
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </Link>
      </div>

      {/* ── Stat cards ──────────────────────────────────────── */}
      <div className="stagger-children grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={Calendar}   label="Turnos hoy"       value={todayAppointments.length}    sub={`${yesterdayCount} ayer`}              delta={todayVsYesterday} accent="#0284c7" />
        <StatCard icon={Users}      label="Clientes"         value={totalClients}                 sub={`${totalAppointments} totales`}                                accent="#3d8060" />
        <StatCard icon={DollarSign} label="Cobrado hoy"      value={formatPrice(todayRevenue)}    sub="ingresos del día"                                              accent="#c8922a" />
        <StatCard icon={Clock}      label="Pendientes"       value={pendingPayments}              sub="sin cobrar"                            alert={pendingPayments > 0} accent="#d4745a" />
      </div>

      {/* ── Content grid ────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3 xl:grid-cols-3">

        {/* Agenda — 2/3 */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-gray-800">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50">
                <Calendar className="h-3.5 w-3.5 text-blue-500" />
              </span>
              Agenda de hoy
              <span className="ml-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                {todayAppointments.length}
              </span>
            </h2>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                <Calendar className="h-7 w-7 text-gray-300" />
              </div>
              <p className="font-semibold text-gray-400">Sin turnos hoy</p>
              <p className="mt-1 text-sm text-gray-300">Los nuevos turnos aparecerán acá</p>
              <Link href={`/book/${session!.user.slug}`} target="_blank" className="mt-5">
                <button className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100">
                  Compartir link de reservas
                </button>
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl shadow-sm stagger-children"
                 style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}>
              {todayAppointments.map((apt, i) => (
                <div
                  key={apt.id}
                  className="flex items-center gap-4 px-5 py-4 transition-colors"
                  style={{
                    borderBottom: i < todayAppointments.length - 1 ? "1px solid var(--border-subtle)" : "none",
                  }}
                >
                  {/* Time */}
                  <div
                    className="flex w-14 shrink-0 flex-col items-center rounded-xl py-2"
                    style={{ backgroundColor: `${apt.service.color}18` }}
                  >
                    <span className="text-sm font-bold leading-none" style={{ color: apt.service.color }}>
                      {format(apt.startTime, "HH:mm")}
                    </span>
                    <span className="mt-0.5 text-[10px] text-gray-400">{format(apt.endTime, "HH:mm")}</span>
                  </div>

                  <div className="h-8 w-1 shrink-0 rounded-full" style={{ backgroundColor: apt.service.color }} />

                  <div className="flex-1 min-w-0">
                    <p className="truncate font-semibold text-gray-800">{apt.client.name}</p>
                    <p className="truncate text-sm text-gray-400">{apt.service.name}</p>
                  </div>

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

        {/* Panel lateral — 1/3 */}
        <div className="space-y-5">
          {/* Próximos */}
          <div>
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-800">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50">
                <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
              </span>
              Próximos turnos
            </h2>
            {nextAppointments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-100 bg-white px-4 py-6 text-center text-sm text-gray-300">
                Sin próximos turnos
              </div>
            ) : (
              <div className="space-y-2">
                {nextAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm"
                      style={{ backgroundColor: apt.service.color }}
                    >
                      {apt.client.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-800">{apt.client.name}</p>
                      <p className="text-xs text-gray-400">
                        {format(apt.startTime, "d MMM · HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Link rápido */}
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
            <p className="text-sm font-semibold text-emerald-800">Tu link de reservas</p>
            <p className="mt-0.5 text-xs text-blue-500">Compartilo con tus pacientes</p>
            <Link href={`/book/${session!.user.slug}`} target="_blank">
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-emerald-100 transition-all hover:ring-emerald-200">
                <span className="flex-1 truncate text-xs font-medium text-emerald-700">
                  /book/{session!.user.slug}
                </span>
                <ArrowRight className="h-3 w-3 shrink-0 text-emerald-400" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, sub, accent, delta, alert,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub: string;
  accent: string;
  delta?: number;
  alert?: boolean;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-lg sm:p-5"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {/* Accent top bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ backgroundColor: accent }} />

      <div className="flex items-start justify-between gap-2 pt-1">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest sm:text-xs" style={{ color: "var(--text-faint)" }}>
            {label}
          </p>
          <p className="mt-2 text-2xl font-black sm:text-3xl" style={{ color: "var(--text)", letterSpacing: "-0.03em" }}>
            {value}
          </p>
          <p className="mt-0.5 hidden text-xs sm:block" style={{ color: "var(--text-muted)" }}>{sub}</p>
          {delta !== undefined && (
            <p className={`mt-0.5 hidden text-xs font-semibold sm:block ${delta > 0 ? "text-blue-500" : delta < 0 ? "text-rose-500" : ""}`}
               style={delta === 0 ? { color: "var(--text-faint)" } : undefined}>
              {delta > 0 ? `+${delta}` : delta} vs ayer
            </p>
          )}
        </div>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10"
          style={{ backgroundColor: `${accent}18` }}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: accent }} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
    PENDING:   { label: "Pendiente",  variant: "warning"     },
    CONFIRMED: { label: "Confirmado", variant: "success"     },
    CANCELLED: { label: "Cancelado",  variant: "destructive" },
    COMPLETED: { label: "Completado", variant: "secondary"   },
    NO_SHOW:   { label: "No asistió", variant: "destructive" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "secondary" };
  return <Badge variant={variant}>{label}</Badge>;
}

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
    UNPAID:   { label: "Sin pagar",   variant: "warning"   },
    PAID:     { label: "Pagado",      variant: "success"   },
    REFUNDED: { label: "Reembolsado", variant: "secondary" },
    FAILED:   { label: "Fallido",     variant: "destructive" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "secondary" };
  return <Badge variant={variant}>{label}</Badge>;
}
