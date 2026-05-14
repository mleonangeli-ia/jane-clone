import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Phone, Mail } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);
  const tenantId = session!.user.id;

  const clients = await prisma.client.findMany({
    where: { tenantId },
    include: {
      appointments: {
        where: { status: { notIn: ["CANCELLED"] } },
        orderBy: { startTime: "desc" },
        take: 1,
      },
      _count: { select: { appointments: { where: { status: { notIn: ["CANCELLED"] } } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <span className="text-sm text-gray-500">{clients.length} clientes</span>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="text-gray-400">Todavía no tenés clientes registrados.</p>
            <p className="mt-1 text-sm text-gray-400">Los clientes aparecen automáticamente cuando reservan un turno.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{client.name}</p>
                    <p className="text-xs text-gray-500">{client._count.appointments} turnos</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                </div>
                {client.appointments[0] && (
                  <p className="mt-4 text-xs text-gray-400">
                    Último turno:{" "}
                    {format(client.appointments[0].startTime, "d MMM yyyy", { locale: es })}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
