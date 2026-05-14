import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, DollarSign, Clock } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { startOfDay, endOfDay, format } from "date-fns";
import { es } from "date-fns/locale";
import { AppointmentActions } from "@/components/appointments/AppointmentActions";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const tenantId = session!.user.id;
  const today = new Date();

  const [todayAppointments, totalClients, pendingPayments, totalAppointments] = await Promise.all([
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
  ]);

  const todayRevenue = todayAppointments
    .filter((a) => a.paymentStatus === "PAID")
    .reduce((sum, a) => sum + a.service.price, 0);

  const hour = today.getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting}, {session!.user.name?.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-gray-500">
          {format(today, "EEEE d 'de' MMMM", { locale: es })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Calendar} label="Turnos hoy" value={todayAppointments.length} sub={`${totalAppointments} totales`} iconBg="bg-indigo-50" iconColor="text-indigo-600" accent="bg-gradient-to-r from-indigo-500 to-violet-600" />
        <StatCard icon={Users} label="Clientes" value={totalClients} sub="registrados" iconBg="bg-sky-50" iconColor="text-sky-600" accent="bg-gradient-to-r from-sky-500 to-cyan-600" />
        <StatCard icon={DollarSign} label="Cobrado hoy" value={formatPrice(todayRevenue)} sub="en el día" iconBg="bg-emerald-50" iconColor="text-emerald-600" accent="bg-gradient-to-r from-emerald-500 to-teal-600" />
        <StatCard icon={Clock} label="Cobros pendientes" value={pendingPayments} sub="sin cobrar" iconBg="bg-orange-50" iconColor="text-orange-600" accent="bg-gradient-to-r from-orange-500 to-amber-600" />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Calendar className="h-5 w-5 text-indigo-500" />
            Agenda de hoy
          </h2>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
            {todayAppointments.length} turnos
          </span>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <Calendar className="h-6 w-6 text-gray-400" />
            </div>
            <p className="font-medium text-gray-500">Sin turnos programados para hoy</p>
            <p className="mt-1 text-sm text-gray-400">Los nuevos turnos aparecerán acá</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayAppointments.map((apt) => (
              <div key={apt.id} className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-gray-200">
                <div className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-gray-50 py-2.5 text-center">
                  <span className="text-base font-bold text-gray-900 leading-none">{format(apt.startTime, "HH:mm")}</span>
                  <span className="mt-1 text-xs text-gray-400">{format(apt.endTime, "HH:mm")}</span>
                </div>
                <div className="h-10 w-1 shrink-0 rounded-full" style={{ backgroundColor: apt.service.color }} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{apt.client.name}</p>
                  <p className="text-sm text-gray-500 truncate">{apt.service.name}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="hidden sm:block text-sm font-semibold text-gray-700">{formatPrice(apt.service.price)}</span>
                  <PaymentBadge status={apt.paymentStatus} />
                  <StatusBadge status={apt.status} />
                  <AppointmentActions appointmentId={apt.id} currentStatus={apt.status} currentPaymentStatus={apt.paymentStatus} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, iconBg, iconColor, accent }: {
  icon: React.ElementType; label: string; value: number | string; sub: string;
  iconBg: string; iconColor: string; accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          <p className="mt-1 text-xs text-gray-400">{sub}</p>
        </div>
        <div className={`rounded-xl ${iconBg} p-3`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 h-0.5 w-full ${accent} opacity-70`} />
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
