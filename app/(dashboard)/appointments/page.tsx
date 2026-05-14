import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AppointmentActions } from "@/components/appointments/AppointmentActions";

export default async function AppointmentsPage() {
  const session = await getServerSession(authOptions);
  const tenantId = session!.user.id;

  const appointments = await prisma.appointment.findMany({
    where: { tenantId },
    include: { client: true, service: true },
    orderBy: { startTime: "desc" },
    take: 50,
  });

  const grouped = appointments.reduce<Record<string, typeof appointments>>((acc, apt) => {
    const key = format(apt.startTime, "yyyy-MM-dd");
    if (!acc[key]) acc[key] = [];
    acc[key].push(apt);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-400">
            Todavía no hay turnos registrados.
          </CardContent>
        </Card>
      ) : (
        (Object.entries(grouped) as [string, typeof appointments][]).map(([date, apts]) => (
          <div key={date}>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-400">
              {format(new Date(date + "T12:00:00"), "EEEE d 'de' MMMM", { locale: es })}
            </h2>
            <div className="space-y-2">
              {apts.map((apt) => (
                <Card key={apt.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-1 rounded-full" style={{ backgroundColor: apt.service.color }} />
                      <div>
                        <p className="font-medium text-gray-900">{apt.client.name}</p>
                        <p className="text-sm text-gray-500">
                          {apt.service.name} · {format(apt.startTime, "HH:mm")} – {format(apt.endTime, "HH:mm")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700">
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
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

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
    UNPAID: { label: "Sin pagar", variant: "warning" },
    PAID: { label: "Pagado", variant: "success" },
    REFUNDED: { label: "Reembolsado", variant: "secondary" },
    FAILED: { label: "Fallido", variant: "destructive" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "secondary" };
  return <Badge variant={variant}>{label}</Badge>;
}
