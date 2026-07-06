import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Users, ExternalLink } from "lucide-react";
import Link from "next/link";
import { StaffForm } from "@/components/staff/StaffForm";
import { StaffCard } from "@/components/staff/StaffCard";

export default async function StaffPage() {
  const session = await getServerSession(authOptions);
  const tenantId = session!.user.id;

  const [staffList, tenant] = await Promise.all([
    prisma.staff.findMany({
      where: { tenantId },
      include: {
        availability: true,
        _count: { select: { appointments: { where: { status: { notIn: ["CANCELLED"] } } } } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, slug: true, isClinic: true } }),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const clinicUrl = `${appUrl}/book/${tenant?.slug}`;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl" style={{ color: "var(--text)", letterSpacing: "-0.03em" }}>
            Equipo
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
            Gestioná los profesionales de tu clínica
          </p>
        </div>
        {tenant?.isClinic && (
          <Link href={clinicUrl} target="_blank">
            <button
              className="hidden items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all sm:flex"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              Ver página de la clínica
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </Link>
        )}
      </div>

      {/* Info banner when no staff */}
      {staffList.length === 0 && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-800">Activá el modo clínica</p>
              <p className="mt-1 text-sm text-emerald-600">
                Al agregar profesionales, tu página de reservas mostrará primero el equipo para que los pacientes elijan con quién atenderse.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add staff form */}
      <div>
        <h2 className="mb-4 font-semibold" style={{ color: "var(--text)" }}>Agregar profesional</h2>
        <StaffForm />
      </div>

      {/* Staff list */}
      {staffList.length > 0 && (
        <div>
          <h2 className="mb-4 font-semibold" style={{ color: "var(--text)" }}>
            Equipo ({staffList.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {staffList.map((member) => (
              <StaffCard
                key={member.id}
                member={member}
                tenantSlug={tenant?.slug ?? ""}
                appointmentCount={member._count.appointments}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
