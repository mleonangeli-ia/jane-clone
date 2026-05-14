import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AvailabilityForm } from "@/components/availability/AvailabilityForm";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default async function AvailabilityPage() {
  const session = await getServerSession(authOptions);
  const tenantId = session!.user.id;

  const availability = await prisma.availability.findMany({
    where: { tenantId },
    orderBy: { dayOfWeek: "asc" },
  });

  const byDay = Object.fromEntries(availability.map((a) => [a.dayOfWeek, a]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Disponibilidad</h1>
      <p className="text-gray-500">Configurá los días y horarios en que atendés.</p>
      <AvailabilityForm initialData={byDay} />
    </div>
  );
}
