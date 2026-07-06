import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { formatPrice, formatDuration } from "@/lib/utils";
import { getT, type Locale } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/booking/LanguageSwitcher";
import { Clock, MapPin, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

function getInitial(name: string) {
  const TITLES = ["lic.", "dr.", "dra.", "mg.", "prof.", "ing."];
  const parts = name.trim().split(/\s+/);
  const first = parts.find((p) => !TITLES.includes(p.toLowerCase())) ?? parts[0];
  return first.charAt(0).toUpperCase();
}

export default async function StaffBookingPage({
  params,
}: {
  params: Promise<{ slug: string; staffSlug: string }>;
}) {
  const { slug, staffSlug } = await params;
  const cookieStore = await cookies();
  const locale = (cookieStore.get("jane-locale")?.value ?? "es") as Locale;
  const t = getT(locale);

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { services: { where: { isActive: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!tenant) notFound();

  const member = await prisma.staff.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug: staffSlug } },
  });
  if (!member || !member.isActive) notFound();

  const ac = member.accentColor;
  const initial = getInitial(member.name);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative" style={{ background: `linear-gradient(145deg, ${ac}f0, ${ac}cc)` }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="relative mx-auto max-w-md px-6 pb-10 pt-10">
          {/* Top bar */}
          <div className="mb-6 flex items-center justify-between">
            <Link href={`/book/${slug}`}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <p className="text-sm font-medium text-white/80">{tenant.name}</p>
            <LanguageSwitcher current={locale} />
          </div>

          {/* Staff profile */}
          <div className="mb-5 flex justify-center">
            <div className="relative">
              <div
                className="flex h-24 w-24 items-center justify-center rounded-full text-4xl font-black text-white"
                style={{ background: "rgba(255,255,255,0.25)", boxShadow: "0 0 0 4px rgba(255,255,255,0.3)" }}
              >
                {initial}
              </div>
              <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-white bg-emerald-400" />
            </div>
          </div>

          <div className="text-center text-white">
            <h1 className="text-2xl font-black tracking-tight">
              {member.title ? `${member.title} ` : ""}{member.name}
            </h1>
            {member.bio && (
              <p className="mx-auto mt-2 max-w-[280px] text-sm text-white/75">{member.bio}</p>
            )}
            {tenant.address && (
              <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-white/60">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{tenant.address}</span>
              </div>
            )}
          </div>
        </div>

        <div className="relative" style={{ marginBottom: "-1px" }}>
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full" style={{ height: "60px", display: "block" }}>
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,60 L0,60 Z" fill="white" />
          </svg>
        </div>
      </div>

      {/* Services */}
      <div className="mx-auto max-w-md px-5 pb-16 pt-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">{t.booking.chooseService}</h2>
          <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: ac }}>
            {tenant.services.length} {locale === "en" ? "available" : locale === "pt" ? "disponíveis" : "disponibles"}
          </span>
        </div>

        {tenant.services.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400">
            Sin servicios disponibles
          </div>
        ) : (
          <div className="space-y-3">
            {tenant.services.map((service) => (
              <Link key={service.id} href={`/book/${slug}/team/${staffSlug}/${service.id}`}>
                <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all hover:-translate-y-0.5 hover:shadow-xl"
                     style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                  <div className="h-0.5 w-full" style={{ backgroundColor: service.color }} />
                  <div className="flex items-center gap-4 p-4">
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${service.color}, ${service.color}bb)` }}
                    >
                      {service.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900">{service.name}</p>
                      {service.description && (
                        <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">{service.description}</p>
                      )}
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                              style={{ backgroundColor: `${service.color}12`, color: service.color }}>
                          <Clock className="h-3 w-3" />{formatDuration(service.duration)}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2.5">
                      <span className="text-xl font-black text-gray-900">{formatPrice(service.price)}</span>
                      <div className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-white"
                           style={{ backgroundColor: service.color }}>
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
      </div>
    </div>
  );
}
