import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatPrice, formatDuration } from "@/lib/utils";
import { Clock, MapPin, ChevronRight, Calendar } from "lucide-react";
import Link from "next/link";

export default async function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { services: { where: { isActive: true }, orderBy: { createdAt: "asc" } } },
  });

  if (!tenant) notFound();

  const ac = tenant.accentColor;

  return (
    <div className="min-h-screen" style={{ background: "#f8f8fb" }}>

      {/* ── Full hero header ─────────────────────────────────── */}
      <div
        className="relative overflow-hidden px-6 pb-16 pt-12"
        style={{ background: `linear-gradient(160deg, ${ac}, ${ac}bb)` }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, white, transparent)" }}
        />
        <div
          className="absolute -bottom-8 -left-12 h-40 w-40 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, white, transparent)" }}
        />

        <div className="relative mx-auto max-w-lg">
          {/* Avatar */}
          <div className="mb-4 flex justify-center">
            <div
              className="flex h-24 w-24 items-center justify-center rounded-full text-4xl font-extrabold text-white shadow-2xl ring-4 ring-white/30"
              style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}
            >
              {tenant.name.charAt(0)}
            </div>
          </div>

          {/* Name & bio */}
          <div className="text-center text-white">
            <h1 className="text-2xl font-extrabold tracking-tight drop-shadow-sm">
              {tenant.name}
            </h1>
            {tenant.bio && (
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/80">
                {tenant.bio}
              </p>
            )}
            {tenant.address && (
              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-white/70">
                <MapPin className="h-3.5 w-3.5" />
                <span>{tenant.address}</span>
              </div>
            )}
          </div>

          {/* Stats pill */}
          <div className="mt-5 flex justify-center">
            <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-xs font-medium text-white backdrop-blur-sm">
              <Calendar className="h-3.5 w-3.5" />
              {tenant.services.length} servicio{tenant.services.length !== 1 ? "s" : ""} disponible{tenant.services.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      {/* ── Services ──────────────────────────────────────────── */}
      <div className="mx-auto max-w-lg -mt-5 px-4 pb-16">
        {tenant.services.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center text-gray-400">
            No hay servicios disponibles en este momento.
          </div>
        ) : (
          <div className="space-y-3">
            {tenant.services.map((service, i) => (
              <Link key={service.id} href={`/book/${slug}/${service.id}`}>
                <div
                  className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* Left accent stripe */}
                  <div
                    className="absolute left-0 top-0 h-full w-1.5"
                    style={{ backgroundColor: service.color }}
                  />

                  <div className="flex items-center gap-4 py-4 pl-6 pr-5">
                    {/* Color icon */}
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white shadow-md"
                      style={{ background: `linear-gradient(135deg, ${service.color}, ${service.color}99)` }}
                    >
                      {service.name.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{service.name}</p>
                      {service.description && (
                        <p className="mt-0.5 text-sm text-gray-400 line-clamp-1">{service.description}</p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: `${service.color}15`, color: service.color }}
                        >
                          <Clock className="h-3 w-3" />
                          {formatDuration(service.duration)}
                        </span>
                      </div>
                    </div>

                    {/* Price + arrow */}
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className="text-lg font-extrabold text-gray-900">
                        {formatPrice(service.price)}
                      </span>
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-full transition-all group-hover:scale-110"
                        style={{ backgroundColor: `${service.color}18` }}
                      >
                        <ChevronRight
                          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                          style={{ color: service.color }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-xs text-gray-400">
            Reservas gestionadas por{" "}
            <span className="font-semibold text-gray-500">JaneClone</span>
          </p>
        </div>
      </div>
    </div>
  );
}
