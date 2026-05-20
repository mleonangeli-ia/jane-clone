import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AppointmentActions } from "@/components/appointments/AppointmentActions";
import { Suspense } from "react";
import { AppointmentsFilters } from "@/components/appointments/AppointmentsFilters";
import Link from "next/link";
import { AppointmentStatus, Prisma } from "@prisma/client";

const PAGE_SIZE = 25;

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; serviceId?: string; page?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const tenantId = session!.user.id;
  const { q, status, serviceId, page: pageParam } = await searchParams;

  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where: Prisma.AppointmentWhereInput = { tenantId };
  if (q) where.client = { name: { contains: q, mode: "insensitive" } };
  if (status && Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
    where.status = status as AppointmentStatus;
  }
  if (serviceId) where.serviceId = serviceId;

  const [rawAppointments, services] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: { client: true, service: true },
      orderBy: { startTime: "desc" },
      skip,
      take: PAGE_SIZE + 1,
    }),
    prisma.service.findMany({ where: { tenantId } }),
  ]);

  const hasMore = rawAppointments.length > PAGE_SIZE;
  const appointments = hasMore ? rawAppointments.slice(0, PAGE_SIZE) : rawAppointments;

  const grouped = appointments.reduce<Record<string, typeof appointments>>((acc, apt) => {
    const key = format(apt.startTime, "yyyy-MM-dd");
    if (!acc[key]) acc[key] = [];
    acc[key].push(apt);
    return acc;
  }, {});

  function buildPageUrl(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (serviceId) params.set("serviceId", serviceId);
    params.set("page", String(targetPage));
    return `/dashboard/appointments?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
      </div>

      <Suspense fallback={<div className="h-9 w-full rounded-md bg-gray-100 animate-pulse" />}>
        <AppointmentsFilters
          services={services.map((s) => ({ id: s.id, name: s.name }))}
          defaultValues={{ q, status, serviceId }}
        />
      </Suspense>

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

      {(page > 1 || hasMore) && (
        <div className="flex items-center justify-between pt-2">
          {page > 1 ? (
            <Link
              href={buildPageUrl(page - 1)}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              ← Anterior
            </Link>
          ) : (
            <span />
          )}
          {hasMore && (
            <Link
              href={buildPageUrl(page + 1)}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              Siguiente →
            </Link>
          )}
        </div>
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
