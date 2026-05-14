import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatPrice, formatDuration } from "@/lib/utils";
import { Clock, MapPin, ArrowRight, Star } from "lucide-react";
import Link from "next/link";

// Extrae la inicial del primer nombre, saltando títulos como "Lic.", "Dr.", "Dra."
function getInitial(name: string) {
  const TITLES = ["lic.", "dr.", "dra.", "mg.", "prof.", "ing."];
  const parts = name.trim().split(/\s+/);
  const first = parts.find((p) => !TITLES.includes(p.toLowerCase())) ?? parts[0];
  return first.charAt(0).toUpperCase();
}

export default async function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { services: { where: { isActive: true }, orderBy: { createdAt: "asc" } } },
  });

  if (!tenant) notFound();

  const ac = tenant.accentColor;
  const initial = getInitial(tenant.name);

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ───────────────────────────────────────────────── */}
      <div className="relative" style={{ background: `linear-gradient(145deg, ${ac}f0 0%, ${ac}cc 100%)` }}>

        {/* Mesh texture overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }}
        />

        <div className="relative mx-auto max-w-md px-6 pb-10 pt-12">
          {/* Avatar */}
          <div className="mb-5 flex justify-center">
            <div className="relative">
              <div
                className="flex h-28 w-28 items-center justify-center rounded-full text-5xl font-black text-white"
                style={{ background: "rgba(255,255,255,0.25)", boxShadow: "0 0 0 4px rgba(255,255,255,0.3), 0 20px 60px rgba(0,0,0,0.15)" }}
              >
                {initial}
              </div>
              {/* Online badge */}
              <div className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-emerald-400">
                <div className="h-2 w-2 rounded-full bg-white" />
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tight text-white">
              {tenant.name}
            </h1>
            {tenant.bio && (
              <p className="mx-auto mt-2.5 max-w-[280px] text-sm leading-relaxed text-white/75">
                {tenant.bio}
              </p>
            )}
            {tenant.address && (
              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-white/60">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{tenant.address}</span>
              </div>
            )}

            {/* Rating pill */}
            <div className="mt-4 flex justify-center">
              <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                <Star className="h-3 w-3 fill-yellow-300 text-yellow-300" />
                <span>Turnos online disponibles</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave bottom */}
        <div className="relative" style={{ marginBottom: "-1px" }}>
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full" style={{ height: "60px", display: "block" }}>
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,60 L0,60 Z" fill="white" />
          </svg>
        </div>
      </div>

      {/* ── Services ──────────────────────────────────────────── */}
      <div className="mx-auto max-w-md px-5 pb-16 pt-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Elegí un servicio</h2>
          <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: ac }}>
            {tenant.services.length} disponibles
          </span>
        </div>

        {tenant.services.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400">
            No hay servicios disponibles en este momento.
          </div>
        ) : (
          <div className="space-y-3">
            {tenant.services.map((service) => (
              <Link key={service.id} href={`/book/${slug}/${service.id}`}>
                <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-xl"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
                >
                  {/* Top color line */}
                  <div className="h-0.5 w-full" style={{ backgroundColor: service.color }} />

                  <div className="flex items-center gap-4 p-4">
                    {/* Icon */}
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${service.color} 0%, ${service.color}bb 100%)` }}
                    >
                      {service.name.charAt(0)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900">{service.name}</p>
                      {service.description && (
                        <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">{service.description}</p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                          style={{ backgroundColor: `${service.color}12`, color: service.color }}
                        >
                          <Clock className="h-3 w-3" />
                          {formatDuration(service.duration)}
                        </span>
                      </div>
                    </div>

                    {/* Price + CTA */}
                    <div className="flex shrink-0 flex-col items-end gap-2.5 pl-2">
                      <span className="text-xl font-black text-gray-900">{formatPrice(service.price)}</span>
                      <div
                        className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-white transition-all group-hover:gap-1.5"
                        style={{ backgroundColor: service.color }}
                      >
                        <span>Reservar</span>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Footer branding */}
        <div className="mt-10 flex flex-col items-center gap-1">
          <div className="h-px w-12 bg-gray-200" />
          <p className="mt-3 text-xs text-gray-400">
            Powered by <span className="font-semibold text-gray-500">JaneClone</span>
          </p>
        </div>
      </div>
    </div>
  );
}
