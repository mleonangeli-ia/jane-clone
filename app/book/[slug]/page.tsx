import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { formatPrice, formatDuration } from "@/lib/utils";
import { getT, type Locale } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/booking/LanguageSwitcher";
import { Clock, MapPin, ArrowRight, Star } from "lucide-react";
import Link from "next/link";

function getInitial(name: string) {
  const TITLES = ["lic.", "dr.", "dra.", "mg.", "prof.", "ing."];
  const parts = name.trim().split(/\s+/);
  const first = parts.find((p) => !TITLES.includes(p.toLowerCase())) ?? parts[0];
  return first.charAt(0).toUpperCase();
}

export default async function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const locale = (cookieStore.get("jane-locale")?.value ?? "es") as Locale;
  const t = getT(locale);

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      services: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
      staff:    { where: { isActive: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!tenant) notFound();

  const ac = tenant.accentColor;
  const initial = getInitial(tenant.name);

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="relative" style={{ background: `linear-gradient(145deg, ${ac}f0 0%, ${ac}cc 100%)` }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }}
        />

        <div className="relative mx-auto max-w-md px-6 pb-10 pt-10">
          {/* Language switcher */}
          <div className="mb-6 flex justify-end">
            <LanguageSwitcher current={locale} />
          </div>

          {/* Avatar */}
          <div className="mb-5 flex justify-center">
            <div className="relative">
              <div
                className="flex h-28 w-28 items-center justify-center rounded-full text-5xl font-black text-white"
                style={{ background: "rgba(255,255,255,0.25)", boxShadow: "0 0 0 4px rgba(255,255,255,0.3), 0 20px 60px rgba(0,0,0,0.15)" }}
              >
                {initial}
              </div>
              <div className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-blue-400">
                <div className="h-2 w-2 rounded-full bg-white" />
              </div>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tight text-white">{tenant.name}</h1>
            {tenant.bio && (
              <p className="mx-auto mt-2.5 max-w-[280px] text-sm leading-relaxed text-white/75">{tenant.bio}</p>
            )}
            {tenant.address && (
              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-white/60">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{tenant.address}</span>
              </div>
            )}
            <div className="mt-4 flex justify-center">
              <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                <Star className="h-3 w-3 fill-yellow-300 text-yellow-300" />
                <span>{t.booking.servicesAvailable(tenant.services.length)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative" style={{ marginBottom: "-1px" }}>
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full" style={{ height: "60px", display: "block" }}>
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,60 L0,60 Z" fill="white" />
          </svg>
        </div>
      </div>

      {/* ── Team (if clinic) ─────────────────────────────────── */}
      {tenant.isClinic && tenant.staff.length > 0 && (
        <div className="mx-auto max-w-md px-5 pt-6">
          <h2 className="mb-4 text-base font-bold text-gray-900">
            {locale === "en" ? "Choose a professional" : locale === "pt" ? "Escolha um profissional" : "Elegí un profesional"}
          </h2>
          <div className="space-y-3">
            {tenant.staff.map((member) => {
              const mi = member.name.split(" ").find(p => !["Lic.", "Dr.", "Dra.", "Mg.", "Prof."].includes(p))?.charAt(0) ?? member.name.charAt(0);
              return (
                <Link key={member.id} href={`/book/${slug}/team/${member.slug}`}>
                  <div className="group flex cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <div className="h-0.5 w-full absolute top-0 left-0 rounded-t-2xl opacity-0" style={{ backgroundColor: member.accentColor }} />
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-black text-white shadow-md"
                      style={{ background: `linear-gradient(135deg, ${member.accentColor}, ${member.accentColor}bb)` }}
                    >
                      {mi.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900">{member.name}</p>
                      {member.bio && <p className="text-xs text-gray-400 truncate">{member.bio}</p>}
                    </div>
                    <div
                      className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: member.accentColor }}
                    >
                      {locale === "en" ? "Book" : locale === "pt" ? "Agendar" : "Reservar"}
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mt-8 border-t border-gray-100 pt-6" />
        </div>
      )}

      {/* ── Services ─────────────────────────────────────────── */}
      <div className="mx-auto max-w-md px-5 pb-16 pt-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">
            {tenant.isClinic && tenant.staff.length > 0
              ? (locale === "en" ? "Or choose a service directly" : locale === "pt" ? "Ou escolha um serviço direto" : "O elegí un servicio directo")
              : t.booking.chooseService}
          </h2>
          <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: ac }}>
            {tenant.services.length} {locale === "en" ? "available" : locale === "pt" ? "disponíveis" : "disponibles"}
          </span>
        </div>

        {tenant.services.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400">
            {locale === "en" ? "No services available at this time." : locale === "pt" ? "Nenhum serviço disponível no momento." : "No hay servicios disponibles en este momento."}
          </div>
        ) : (
          <div className="space-y-3">
            {tenant.services.map((service) => (
              <Link key={service.id} href={`/book/${slug}/${service.id}?lang=${locale}`}>
                <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-xl"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
                >
                  <div className="h-0.5 w-full" style={{ backgroundColor: service.color }} />
                  <div className="flex items-center gap-4 p-4">
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${service.color} 0%, ${service.color}bb 100%)` }}
                    >
                      {service.name.charAt(0)}
                    </div>
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
                        {service.price === 0 && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600">
                            {t.booking.free}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2.5 pl-2">
                      <span className="text-xl font-black text-gray-900">{formatPrice(service.price)}</span>
                      <div
                        className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-white transition-all group-hover:gap-1.5"
                        style={{ backgroundColor: service.color }}
                      >
                        <span>{t.booking.book}</span>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

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
