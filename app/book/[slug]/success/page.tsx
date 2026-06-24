import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { getT, type Locale } from "@/lib/i18n";
import { CheckCircle, Clock, Calendar, MapPin, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { es, enUS, ptBR } from "date-fns/locale";
import Link from "next/link";

const DATE_FNS: Record<Locale, object> = { es, en: enUS, pt: ptBR };

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ appointment_id?: string; pending?: string }>;
}) {
  const { slug } = await params;
  const { appointment_id, pending } = await searchParams;

  const cookieStore = await cookies();
  const locale = (cookieStore.get("jane-locale")?.value ?? "es") as Locale;
  const t = getT(locale).success;
  const dateFnsLocale = DATE_FNS[locale] as Parameters<typeof format>[2]["locale"];

  if (!appointment_id) return <ErrorMessage slug={slug} locale={locale} />;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointment_id },
    include: { service: true, tenant: true, client: true },
  }).catch(() => null);

  if (!appointment) return <ErrorMessage slug={slug} locale={locale} />;

  const isPending = pending === "1";
  const accent = appointment.tenant.accentColor;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />

      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full"
            style={{ backgroundColor: `${isPending ? "#f59e0b" : accent}18` }}
          >
            {isPending
              ? <Clock className="h-12 w-12 text-amber-500" />
              : <CheckCircle className="h-12 w-12" style={{ color: accent }} />
            }
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            {isPending ? t.pending : t.confirmed}
          </h1>
          <p className="mt-2 text-gray-500">
            {isPending ? t.pendingSub : `${t.confirmedSub.split("{{name}}")[0]}${appointment.client.name.split(" ")[0]}`}
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
          <div className="p-5" style={{ background: `linear-gradient(135deg, ${accent}22, ${accent}08)` }}>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white" style={{ backgroundColor: accent }}>
                {appointment.tenant.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{appointment.tenant.name}</p>
                <p className="text-sm text-gray-500">{appointment.service.name}</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-50 px-5">
            <div className="flex items-center gap-3 py-3.5">
              <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
              <span className="text-sm text-gray-500">{t.labelDatetime}</span>
              <span className="ml-auto text-sm font-semibold text-gray-900 capitalize">
                {format(appointment.startTime, "EEEE d MMM · HH:mm", { locale: dateFnsLocale })}
              </span>
            </div>
            {appointment.tenant.address && (
              <div className="flex items-center gap-3 py-3.5">
                <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="text-sm text-gray-500">{t.labelProfessional}</span>
                <span className="ml-auto text-sm font-medium text-gray-900">{appointment.tenant.address}</span>
              </div>
            )}
            {appointment.service.price > 0 && (
              <div className="flex items-center gap-3 py-3.5">
                <span className="h-4 w-4 shrink-0 text-center text-xs text-gray-400">$</span>
                <span className="text-sm text-gray-500">{t.labelTotal}</span>
                <span className="ml-auto text-sm font-bold" style={{ color: isPending ? "#f59e0b" : accent }}>
                  {formatPrice(appointment.service.price)}
                  {isPending && <span className="ml-1 text-xs font-normal text-gray-400">(pending)</span>}
                </span>
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-5 py-3.5">
            <p className="text-center text-xs text-gray-400">
              {t.emailSent} <span className="font-medium text-gray-600">{appointment.client.email}</span>
            </p>
          </div>
        </div>

        <div className="mt-6">
          <Link href={`/book/${slug}`}>
            <button
              className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:opacity-95"
              style={{ backgroundColor: accent }}
            >
              {t.bookAnother}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorMessage({ slug, locale }: { slug: string; locale: Locale }) {
  const msgs: Record<Locale, { title: string; sub: string; back: string }> = {
    es: { title: "No se pudo verificar el turno", sub: "Por favor contactá al profesional.", back: "Volver" },
    en: { title: "Could not verify the appointment", sub: "Please contact the professional.", back: "Back" },
    pt: { title: "Não foi possível verificar a consulta", sub: "Por favor contate o profissional.", back: "Voltar" },
  };
  const m = msgs[locale];
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <h1 className="text-xl font-semibold text-gray-900">{m.title}</h1>
      <p className="mt-2 text-gray-500">{m.sub}</p>
      <Link href={`/book/${slug}`} className="mt-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> {m.back}
      </Link>
    </div>
  );
}
