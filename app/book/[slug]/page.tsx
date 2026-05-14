import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatPrice, formatDuration } from "@/lib/utils";
import { Clock, DollarSign } from "lucide-react";
import Link from "next/link";

export default async function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      services: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!tenant) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-10 text-center">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white"
            style={{ backgroundColor: tenant.accentColor }}
          >
            {tenant.name.charAt(0)}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
          {tenant.bio && <p className="mt-2 text-gray-500">{tenant.bio}</p>}
          {tenant.address && <p className="mt-1 text-sm text-gray-400">{tenant.address}</p>}
        </div>

        <h2 className="mb-4 text-lg font-semibold text-gray-700">Elegí un servicio</h2>

        {tenant.services.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No hay servicios disponibles en este momento.</p>
        ) : (
          <div className="space-y-3">
            {tenant.services.map((service) => (
              <Link key={service.id} href={`/book/${slug}/${service.id}`}>
                <div className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-indigo-200 hover:shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-1.5 rounded-full" style={{ backgroundColor: service.color }} />
                    <div>
                      <p className="font-semibold text-gray-900">{service.name}</p>
                      {service.description && (
                        <p className="mt-0.5 text-sm text-gray-500 line-clamp-1">{service.description}</p>
                      )}
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(service.duration)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="font-bold text-gray-900">{formatPrice(service.price)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
