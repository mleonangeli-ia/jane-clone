import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatPrice, formatDuration } from "@/lib/utils";
import { Clock, MapPin, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { services: { where: { isActive: true }, orderBy: { createdAt: "asc" } } },
  });

  if (!tenant) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header band */}
      <div className="h-32 bg-gradient-to-r from-indigo-600 to-violet-600" style={{
        background: `linear-gradient(135deg, ${tenant.accentColor}dd, ${tenant.accentColor}99)`
      }} />

      <div className="mx-auto max-w-lg px-4">
        {/* Profile card */}
        <div className="-mt-16 mb-8 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
          <div className="flex items-end gap-4 p-6">
            <div
              className="flex h-20 w-20 shrink-0 -mt-2 items-center justify-center rounded-2xl text-3xl font-bold text-white shadow-lg"
              style={{ backgroundColor: tenant.accentColor }}
            >
              {tenant.name.charAt(0)}
            </div>
            <div className="pb-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">{tenant.name}</h1>
              {tenant.bio && (
                <p className="mt-0.5 text-sm text-gray-500 line-clamp-2">{tenant.bio}</p>
              )}
              {tenant.address && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-400">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span>{tenant.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="pb-12">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Servicios disponibles
          </h2>

          {tenant.services.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center text-gray-400">
              No hay servicios disponibles en este momento.
            </div>
          ) : (
            <div className="space-y-3">
              {tenant.services.map((service) => (
                <Link key={service.id} href={`/book/${slug}/${service.id}`}>
                  <div className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-gray-200">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${service.color}18` }}>
                      <div className="h-4 w-4 rounded-full" style={{ backgroundColor: service.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{service.name}</p>
                      {service.description && (
                        <p className="mt-0.5 text-sm text-gray-500 line-clamp-1">{service.description}</p>
                      )}
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        <span>{formatDuration(service.duration)}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="text-base font-bold text-gray-900">{formatPrice(service.price)}</span>
                      <ChevronRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-400" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
