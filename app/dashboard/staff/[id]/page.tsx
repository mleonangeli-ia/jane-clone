import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { StaffProfileForm } from "@/components/staff/StaffProfileForm";
import { StaffAvailabilityForm } from "@/components/staff/StaffAvailabilityForm";

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;

  const member = await prisma.staff.findUnique({
    where: { id },
    include: {
      availability: { orderBy: { dayOfWeek: "asc" } },
      appointments: {
        where: { status: { notIn: ["CANCELLED"] }, startTime: { gte: new Date() } },
        include: { client: true, service: true },
        orderBy: { startTime: "asc" },
        take: 10,
      },
      _count: { select: { appointments: true } },
    },
  });

  if (!member || member.tenantId !== session.user.id) notFound();

  // Build availability map
  const availMap: Record<number, { startTime: string; endTime: string; isActive: boolean }> = {};
  for (let i = 0; i < 7; i++) {
    const a = member.availability.find(x => x.dayOfWeek === i);
    availMap[i] = a
      ? { startTime: a.startTime, endTime: a.endTime, isActive: a.isActive }
      : { startTime: "09:00", endTime: "18:00", isActive: false };
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/staff"
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-muted)" }}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-black text-white shadow-md"
            style={{ background: `linear-gradient(135deg, ${member.accentColor}, ${member.accentColor}bb)` }}
          >
            {member.name.split(" ").find(p => !["Lic.", "Dr.", "Dra.", "Mg."].includes(p))?.charAt(0).toUpperCase() ?? member.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text)", letterSpacing: "-0.03em" }}>
              {member.title ? `${member.title} ` : ""}{member.name}
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {member._count.appointments} turnos · {member.isActive ? "Activo" : "Inactivo"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Perfil ─────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
          Perfil
        </h2>
        <StaffProfileForm
          staffId={id}
          initial={{
            name:        member.name,
            title:       member.title ?? "",
            bio:         member.bio ?? "",
            phone:       member.phone ?? "",
            accentColor: member.accentColor,
            isActive:    member.isActive,
          }}
        />
      </section>

      {/* ── Disponibilidad ─────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
          Disponibilidad horaria
        </h2>
        <StaffAvailabilityForm staffId={id} initialData={availMap} />
      </section>

      {/* ── Próximos turnos ────────────────────────────────── */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
          <Calendar className="h-3.5 w-3.5" />
          Próximos turnos
        </h2>

        {member.appointments.length === 0 ? (
          <div className="flex items-center justify-center rounded-2xl border border-dashed py-10 text-sm"
               style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
            Sin turnos próximos asignados
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-card)" }}>
            {member.appointments.map((apt, i) => (
              <div
                key={apt.id}
                className="flex items-center gap-4 px-5 py-3.5"
                style={{ borderBottom: i < member.appointments.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
              >
                <div
                  className="flex w-14 shrink-0 flex-col items-center rounded-xl py-2 text-center"
                  style={{ backgroundColor: `${apt.service.color}18` }}
                >
                  <span className="text-xs font-bold uppercase" style={{ color: apt.service.color }}>
                    {format(apt.startTime, "MMM", { locale: es })}
                  </span>
                  <span className="text-lg font-extrabold leading-none" style={{ color: apt.service.color }}>
                    {format(apt.startTime, "d")}
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                    {format(apt.startTime, "HH:mm")}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold text-sm" style={{ color: "var(--text)" }}>{apt.client.name}</p>
                  <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>{apt.service.name}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{formatPrice(apt.service.price)}</span>
                  <StatusBadge status={apt.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
    PENDING:   { label: "Pendiente",  variant: "warning" },
    CONFIRMED: { label: "Confirmado", variant: "success" },
    COMPLETED: { label: "Completado", variant: "secondary" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "secondary" };
  return <Badge variant={variant}>{label}</Badge>;
}
