import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice, formatDuration } from "@/lib/utils";
import { ServiceForm } from "@/components/services/ServiceForm";

export default async function ServicesPage() {
  const session = await getServerSession(authOptions);
  const tenantId = session!.user.id;

  const services = await prisma.service.findMany({
    where: { tenantId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Servicios</h1>
        <ServiceForm />
      </div>

      {services.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-400">
            No tenés servicios configurados. Creá uno para que tus clientes puedan reservar.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className={service.isActive ? "" : "opacity-60"}>
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: service.color }} />
                    <h3 className="font-semibold text-gray-900">{service.name}</h3>
                  </div>
                  {!service.isActive && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Inactivo</span>
                  )}
                </div>
                {service.description && (
                  <p className="mb-4 text-sm text-gray-500 line-clamp-2">{service.description}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{formatDuration(service.duration)}</span>
                  <span className="font-bold text-gray-900">{formatPrice(service.price)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
