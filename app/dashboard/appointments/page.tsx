import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AppointmentActions } from "@/components/appointments/AppointmentActions";
import { AppointmentInvoiceButton } from "@/components/invoices/AppointmentInvoiceButton";
import { Suspense } from "react";
import { AppointmentsFilters } from "@/components/appointments/AppointmentsFilters";
import Link from "next/link";
import { AppointmentStatus, Prisma } from "@prisma/client";
import { Users } from "lucide-react";

const PAGE_SIZE = 25;

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; serviceId?: string; staffId?: string; page?: string }>;
}) {
  const session  = await getServerSession(authOptions);
  const tenantId = session!.user.id;
  const { q, status, serviceId, staffId, page: pageParam } = await searchParams;

  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where: Prisma.AppointmentWhereInput = { tenantId };
  if (q)        where.client    = { name: { contains: q, mode: "insensitive" } };
  if (status && Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
    where.status = status as AppointmentStatus;
  }
  if (serviceId) where.serviceId = serviceId;
  if (staffId)   where.staffId   = staffId;

  const [rawAppointments, services, staffList, tenant] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: {
        client:  true,
        service: true,
        staff:   { select: { id: true, name: true, title: true, accentColor: true } },
        invoice: { select: { id: true } },
      },
      orderBy: { startTime: "desc" },
      skip,
      take: PAGE_SIZE + 1,
    }),
    prisma.service.findMany({ where: { tenantId }, select: { id: true, name: true } }),
    prisma.staff.findMany({ where: { tenantId, isActive: true }, select: { id: true, name: true, title: true, accentColor: true }, orderBy: { name: "asc" } }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { isClinic: true } }),
  ]);

  const hasMore     = rawAppointments.length > PAGE_SIZE;
  const appointments = hasMore ? rawAppointments.slice(0, PAGE_SIZE) : rawAppointments;

  const grouped = appointments.reduce<Record<string, typeof appointments>>((acc, apt) => {
    const key = format(apt.startTime, "yyyy-MM-dd");
    if (!acc[key]) acc[key] = [];
    acc[key].push(apt);
    return acc;
  }, {});

  function buildPageUrl(targetPage: number) {
    const params = new URLSearchParams();
    if (q)         params.set("q",         q);
    if (status)    params.set("status",    status);
    if (serviceId) params.set("serviceId", serviceId);
    if (staffId)   params.set("staffId",   staffId);
    params.set("page", String(targetPage));
    return `/dashboard/appointments?${params.toString()}`;
  }

  // Staff header summary when filtering
  const activeStaff = staffId ? staffList.find(s => s.id === staffId) : null;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl" style={{ color: "var(--text)", letterSpacing: "-0.03em" }}>
            Agenda
          </h1>
          {activeStaff && (
            <div className="mt-1 flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: activeStaff.accentColor }}
              />
              <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                Filtrado: {activeStaff.title ? `${activeStaff.title} ` : ""}{activeStaff.name}
              </p>
            </div>
          )}
        </div>

        {/* Staff quick-switch pills (solo para clínicas) */}
        {tenant?.isClinic && staffList.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <Link href="/dashboard/appointments">
              <span
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all"
                style={{
                  backgroundColor: !staffId ? "#0284c7" : "var(--bg-subtle)",
                  color: !staffId ? "white" : "var(--text-muted)",
                }}
              >
                <Users className="h-3 w-3" />
                Todos
              </span>
            </Link>
            {staffList.map(m => {
              const active = staffId === m.id;
              const initial = m.name.split(" ").find(p => !["Lic.", "Dr.", "Dra.", "Mg."].includes(p))?.charAt(0) ?? m.name.charAt(0);
              return (
                <Link key={m.id} href={`/dashboard/appointments?staffId=${m.id}`}>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all"
                    style={{
                      backgroundColor: active ? m.accentColor : "var(--bg-subtle)",
                      color: active ? "white" : "var(--text-muted)",
                    }}
                  >
                    <span
                      className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black"
                      style={{
                        backgroundColor: active ? "rgba(255,255,255,0.3)" : m.accentColor + "30",
                        color: active ? "white" : m.accentColor,
                      }}
                    >
                      {initial.toUpperCase()}
                    </span>
                    {m.name.split(" ").slice(0, 2).join(" ")}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-10 w-full rounded-xl skeleton" />}>
        <AppointmentsFilters
          services={services}
          staffList={tenant?.isClinic ? staffList : []}
          defaultValues={{ q, status, serviceId, staffId }}
        />
      </Suspense>

      {/* Appointments list */}
      {Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center" style={{ color: "var(--text-faint)" }}>
            {staffId || q || status || serviceId
              ? "No hay turnos que coincidan con los filtros."
              : "Todavía no hay turnos registrados."}
          </CardContent>
        </Card>
      ) : (
        (Object.entries(grouped) as [string, typeof appointments][]).map(([date, apts]) => (
          <div key={date}>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>
              {format(new Date(date + "T12:00:00"), "EEEE d 'de' MMMM", { locale: es })}
            </h2>
            <div className="space-y-2">
              {apts.map((apt) => (
                <Card key={apt.id} style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {/* Color bar */}
                      <div className="h-9 w-1 shrink-0 rounded-full" style={{ backgroundColor: apt.service.color }} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>
                            {apt.client.name}
                          </p>
                          {/* Staff badge — visible cuando hay clínica */}
                          {apt.staff && (
                            <span
                              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                              style={{ backgroundColor: apt.staff.accentColor }}
                            >
                              {apt.staff.title ? `${apt.staff.title} ` : ""}
                              {apt.staff.name.split(" ").slice(0, 2).join(" ")}
                            </span>
                          )}
                        </div>
                        <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                          {apt.service.name} · {format(apt.startTime, "HH:mm")}–{format(apt.endTime, "HH:mm")}
                        </p>
                        {/* Mobile: badges */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:hidden">
                          <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>{formatPrice(apt.service.price)}</span>
                          <PaymentBadge status={apt.paymentStatus} />
                          <StatusBadge status={apt.status} />
                        </div>
                      </div>

                      {/* Desktop badges */}
                      <div className="hidden shrink-0 items-center gap-2 sm:flex">
                        <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{formatPrice(apt.service.price)}</span>
                        <PaymentBadge status={apt.paymentStatus} />
                        <StatusBadge status={apt.status} />
                      </div>

                      {apt.status === "COMPLETED" || apt.paymentStatus === "PAID" ? (
                        <AppointmentInvoiceButton
                          appointmentId={apt.id}
                          servicePrice={apt.service.price}
                          existingInvoiceId={apt.invoice?.id}
                        />
                      ) : null}

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

      {/* Pagination */}
      {(page > 1 || hasMore) && (
        <div className="flex items-center justify-center gap-4 pt-2">
          {page > 1 && (
            <Link href={buildPageUrl(page - 1)}>
              <button className="rounded-xl px-4 py-2 text-sm font-medium transition-all"
                      style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                ← Anterior
              </button>
            </Link>
          )}
          <span className="text-sm" style={{ color: "var(--text-faint)" }}>Página {page}</span>
          {hasMore && (
            <Link href={buildPageUrl(page + 1)}>
              <button className="rounded-xl px-4 py-2 text-sm font-medium transition-all"
                      style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                Siguiente →
              </button>
            </Link>
          )}
        </div>
      )}
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
