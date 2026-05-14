import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, DollarSign, Clock } from "lucide-react";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { startOfDay, endOfDay } from "date-fns";
import { AppointmentActions } from "@/components/appointments/AppointmentActions";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const tenantId = session!.user.id;
  const today = new Date();

  const [todayAppointments, totalClients, pendingPayments] = await Promise.all([
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
  ]);

  const todayRevenue = todayAppointments
    .filter((a) => a.paymentStatus === "PAID")
    .reduce((sum, a) => sum + a.service.price, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Buen día, {session!.user.name?.split(" ")[0]}
        </h1>
        <p className="text-gray-500">Acá está el resumen de tu día.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Calendar} label="Turnos hoy" value={todayAppointments.length} color="indigo" />
        <StatCard icon={Users} label="Clientes totales" value={totalClients} color="blue" />
        <StatCard icon={DollarSign} label="Cobrado hoy" value={formatPrice(todayRevenue)} color="green" />
        <StatCard icon={Clock} label="Pagos pendientes" value={pendingPayments} color="yellow" />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Agenda de hoy</h2>
        {todayAppointments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-400">
              No hay turnos programados para hoy.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {todayAppointments.map((apt) => (
              <Card key={apt.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="h-10 w-1 rounded-full"
                      style={{ backgroundColor: apt.service.color }}
                    />
                    <div>
                      <p className="font-medium text-gray-900">{apt.client.name}</p>
                      <p className="text-sm text-gray-500">
                        {apt.service.name} · {formatDateTime(apt.startTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">
                      {formatPrice(apt.service.price)}
                    </span>
                    <StatusBadge status={apt.status} />
                    <AppointmentActions
                      appointmentId={apt.id}
                      currentStatus={apt.status}
                      currentPaymentStatus={apt.paymentStatus}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
}) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600",
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className={`rounded-lg p-2 ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
    PENDING: { label: "Pendiente", variant: "warning" },
    CONFIRMED: { label: "Confirmado", variant: "success" },
    CANCELLED: { label: "Cancelado", variant: "destructive" },
    COMPLETED: { label: "Completado", variant: "secondary" },
    NO_SHOW: { label: "No asistió", variant: "destructive" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "secondary" };
  return <Badge variant={variant}>{label}</Badge>;
}
