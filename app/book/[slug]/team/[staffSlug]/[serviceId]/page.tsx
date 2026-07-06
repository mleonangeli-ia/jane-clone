import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { BookingCalendar } from "@/components/booking/BookingCalendar";
import { formatPrice, formatDuration } from "@/lib/utils";
import { getT, type Locale } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/booking/LanguageSwitcher";
import { Clock, ArrowLeft, Tag } from "lucide-react";
import Link from "next/link";

export default async function StaffServicePage({
  params,
}: {
  params: Promise<{ slug: string; staffSlug: string; serviceId: string }>;
}) {
  const { slug, staffSlug, serviceId } = await params;
  const cookieStore = await cookies();
  const locale = (cookieStore.get("jane-locale")?.value ?? "es") as Locale;
  const t = getT(locale);

  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) notFound();

  const [member, service] = await Promise.all([
    prisma.staff.findUnique({
      where: { tenantId_slug: { tenantId: tenant.id, slug: staffSlug } },
      include: { availability: { where: { isActive: true } } },
    }),
    prisma.service.findFirst({ where: { id: serviceId, tenantId: tenant.id, isActive: true } }),
  ]);

  if (!member || !member.isActive || !service) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Top bar */}
      <div
        className="sticky top-0 z-10 border-b border-black/5"
        style={{ backgroundColor: `${member.accentColor}f0`, backdropFilter: "blur(12px)" }}
      >
        <div className="mx-auto flex h-14 max-w-lg items-center gap-3 px-4">
          <Link href={`/book/${slug}/team/${staffSlug}`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {member.title ? `${member.title} ` : ""}{member.name}
            </p>
          </div>
          <LanguageSwitcher current={locale} />
          {service.price > 0 && (
            <span className="shrink-0 rounded-full bg-white/20 px-3 py-1 text-sm font-bold text-white">
              {formatPrice(service.price)}
            </span>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pb-16 pt-6">
        {/* Service card */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <div className="h-1.5 w-full" style={{ backgroundColor: service.color }} />
          <div className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                 style={{ backgroundColor: `${service.color}18` }}>
              <div className="h-5 w-5 rounded-full" style={{ backgroundColor: service.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900">{service.name}</h1>
              {service.description && (
                <p className="mt-0.5 text-sm text-gray-500 line-clamp-1">{service.description}</p>
              )}
              <div className="mt-1.5 flex flex-wrap gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                  <Clock className="h-3 w-3" />{formatDuration(service.duration)}
                </span>
                {service.price > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                    <Tag className="h-3 w-3" />{formatPrice(service.price)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="mb-6 flex items-center gap-2">
          {[t.steps[0], t.steps[1], t.steps[2]].map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && <div className="h-px flex-1 bg-gray-200" />}
              <div className="flex flex-col items-center gap-1">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? "text-white" : "bg-gray-100 text-gray-400"}`}
                     style={i === 0 ? { backgroundColor: member.accentColor } : undefined}>
                  {i + 1}
                </div>
                <span className={`text-xs whitespace-nowrap ${i === 0 ? "font-semibold text-gray-700" : "text-gray-400"}`}>{step}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Calendar — uses staff availability */}
        <BookingCalendar
          tenantId={tenant.id}
          tenantSlug={slug}
          service={{ id: service.id, name: service.name, duration: service.duration, price: service.price }}
          availability={member.availability}
          accentColor={member.accentColor}
          locale={locale}
          staffId={member.id}
        />
      </div>
    </div>
  );
}
