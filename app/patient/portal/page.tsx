import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getPatientSession } from "@/lib/patient-auth";
import { formatPrice } from "@/lib/utils";
import { format, isPast, isFuture } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function PatientPortalPage() {
  const clientId = await getPatientSession();
  if (!clientId) redirect("/patient");

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      appointments: {
        include: { service: true, tenant: true },
        orderBy: { startTime: "desc" },
        take: 50,
      },
    },
  });

  if (!client) redirect("/patient");

  const upcoming = client.appointments.filter(
    (a) => isFuture(a.startTime) && a.status !== "CANCELLED"
  );
  const past = client.appointments.filter(
    (a) => isPast(a.startTime) || a.status === "CANCELLED"
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400 text-sm font-bold text-white shadow-sm">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-[15px] font-semibold text-gray-900">{client.name}</p>
              <p className="text-xs text-gray-400">{client.email}</p>
            </div>
          </div>
          <form action="/api/patient/auth/logout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-500 transition-all hover:bg-gray-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              Salir
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">

        {/* Summary pills */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-center">
            <p className="text-xl font-extrabold text-sky-600">{upcoming.length}</p>
            <p className="mt-0.5 text-xs text-sky-400">Próximos</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center">
            <p className="text-xl font-extrabold text-emerald-600">
              {client.appointments.filter((a) => a.status === "COMPLETED").length}
            </p>
            <p className="mt-0.5 text-xs text-emerald-400">Completados</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-center shadow-sm">
            <p className="text-xl font-extrabold text-gray-700">{client.appointments.length}</p>
            <p className="mt-0.5 text-xs text-gray-400">Total</p>
          </div>
        </div>

        {/* Upcoming */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-800">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-100">
              <Calendar className="h-3.5 w-3.5 text-sky-500" />
            </span>
            Próximos turnos
            <span className="ml-1 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-600">
              {upcoming.length}
            </span>
          </h2>

          {upcoming.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-10 text-center">
              <Calendar className="mx-auto mb-2 h-8 w-8 text-gray-200" />
              <p className="text-sm text-gray-400">No tenés turnos próximos</p>
              <p className="mt-0.5 text-xs text-gray-300">
                Reservá uno desde el link de tu profesional
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((apt) => (
                <AppointmentCard key={apt.id} apt={apt} isUpcoming />
              ))}
            </div>
          )}
        </section>

        {/* Past */}
        {past.length > 0 && (
          <section>
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-800">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
              </span>
              Historial
            </h2>
            <div className="space-y-2">
              {past.map((apt) => (
                <AppointmentCard key={apt.id} apt={apt} isUpcoming={false} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

type Apt = {
  id: string;
  startTime: Date;
  endTime: Date;
  status: string;
  paymentStatus: string;
  notes: string | null;
  service: { name: string; color: string; price: number; duration: number };
  tenant: { name: string; address: string | null; slug: string; accentColor: string };
};

function AppointmentCard({ apt, isUpcoming }: { apt: Apt; isUpcoming: boolean }) {
  const statusIcon = {
    CONFIRMED:  <CheckCircle className="h-4 w-4 text-emerald-500" />,
    PENDING:    <AlertCircle className="h-4 w-4 text-yellow-500" />,
    CANCELLED:  <XCircle    className="h-4 w-4 text-red-400"     />,
    COMPLETED:  <CheckCircle className="h-4 w-4 text-gray-400"   />,
    NO_SHOW:    <XCircle    className="h-4 w-4 text-orange-400"  />,
  }[apt.status] ?? <AlertCircle className="h-4 w-4 text-gray-400" />;

  const isCancelled = apt.status === "CANCELLED";

  return (
    <div className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${
      isUpcoming ? "border-gray-100 hover:shadow-md" : "border-gray-50 opacity-80"
    }`}>
      {/* Color stripe */}
      <div className="h-1" style={{ backgroundColor: apt.service.color }} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {/* Date block */}
            <div className="flex w-14 shrink-0 flex-col items-center rounded-xl py-2 text-center"
                 style={{ backgroundColor: `${apt.service.color}15` }}>
              <span className="text-xs font-bold uppercase" style={{ color: apt.service.color }}>
                {format(apt.startTime, "MMM", { locale: es })}
              </span>
              <span className="text-xl font-extrabold leading-none" style={{ color: apt.service.color }}>
                {format(apt.startTime, "d")}
              </span>
              <span className="text-[10px] text-gray-400">
                {format(apt.startTime, "HH:mm")}
              </span>
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="font-bold text-gray-900 truncate">{apt.service.name}</p>
              <p className="mt-0.5 text-sm font-medium text-gray-500">{apt.tenant.name}</p>
              {apt.tenant.address && (
                <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{apt.tenant.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="flex items-center gap-1">
              {statusIcon}
              <StatusBadge status={apt.status} />
            </div>
            {apt.service.price > 0 && (
              <span className="text-sm font-bold text-gray-700">
                {formatPrice(apt.service.price)}
              </span>
            )}
          </div>
        </div>

        {/* Cancel CTA for upcoming confirmed */}
        {isUpcoming && !isCancelled && apt.status === "CONFIRMED" && (
          <div className="mt-3 border-t border-gray-50 pt-3">
            <Link
              href={`/book/${apt.tenant.slug}?cancel=${apt.id}`}
              className="text-xs text-red-400 hover:text-red-600 hover:underline"
            >
              Cancelar turno
            </Link>
          </div>
        )}
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
