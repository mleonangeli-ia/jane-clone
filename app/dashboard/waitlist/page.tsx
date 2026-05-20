import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export default async function WaitlistPage() {
  const session = await getServerSession(authOptions);

  const entries = await prisma.waitlistEntry.findMany({
    where: { tenantId: session!.user.id },
    include: { service: true },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Lista de espera</h1>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-12 text-center">
          <p className="text-sm text-gray-400">No hay entradas en la lista de espera.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Servicio</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const dateLabel = format(parseISO(entry.date), "d 'de' MMMM yyyy", { locale: es });
                return (
                  <tr key={entry.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{entry.name}</td>
                    <td className="px-4 py-3 text-gray-500">{entry.email}</td>
                    <td className="px-4 py-3 text-gray-500">{entry.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{entry.service.name}</td>
                    <td className="px-4 py-3 capitalize text-gray-500">{dateLabel}</td>
                    <td className="px-4 py-3">
                      {entry.notifiedAt ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                          Notificado {format(entry.notifiedAt, "d/M/yy HH:mm")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700">
                          Pendiente
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
