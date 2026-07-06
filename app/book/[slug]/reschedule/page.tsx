import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyCancelToken } from "@/lib/cancel-token";
import { differenceInHours, format } from "date-fns";
import { es } from "date-fns/locale";
import { formatPrice, formatDuration } from "@/lib/utils";
import { RescheduleCalendar } from "@/components/booking/RescheduleCalendar";
import { Calendar, Clock, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { getT, type Locale } from "@/lib/i18n";

export default async function ReschedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ id?: string; token?: string }>;
}) {
  const { slug } = await params;
  const { id, token } = await searchParams;

  const cookieStore = await cookies();
  const locale = (cookieStore.get("jane-locale")?.value ?? "es") as Locale;
  const t = getT(locale);

  // Validate params
  if (!id || !token) {
    return <ErrorPage slug={slug} message="Link inválido" locale={locale} />;
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      client:  true,
      service: true,
      tenant:  { include: { availability: { where: { isActive: true } } } },
    },
  });

  if (!appointment || appointment.tenant.slug !== slug) {
    return <ErrorPage slug={slug} message="Turno no encontrado" locale={locale} />;
  }

  if (!verifyCancelToken(token, appointment.id, appointment.createdAt)) {
    return <ErrorPage slug={slug} message="Link inválido o expirado" locale={locale} />;
  }

  if (!["CONFIRMED", "PENDING"].includes(appointment.status)) {
    return (
      <ErrorPage
        slug={slug}
        message={appointment.status === "CANCELLED" ? "Este turno ya fue cancelado" : "Este turno no se puede reagendar"}
        locale={locale}
      />
    );
  }

  const cancelHours = appointment.tenant.cancelWindowHours ?? 2;
  const hoursUntil = differenceInHours(appointment.startTime, new Date());
  const tooLate = hoursUntil < cancelHours;

  const ac = appointment.tenant.accentColor;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="border-b border-gray-100 bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link href={`/book/${slug}`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm"
               style={{ backgroundColor: ac }}>
            {appointment.tenant.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{appointment.tenant.name}</p>
            <p className="text-xs text-gray-400">Reagendar turno</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-8 space-y-5">

        {/* Turno actual */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-50 px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Turno actual</p>
          </div>
          <div className="flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl text-center"
                 style={{ backgroundColor: `${appointment.service.color}18` }}>
              <span className="text-xs font-bold uppercase" style={{ color: appointment.service.color }}>
                {format(appointment.startTime, "MMM", { locale: es })}
              </span>
              <span className="text-xl font-extrabold leading-none" style={{ color: appointment.service.color }}>
                {format(appointment.startTime, "d")}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900">{appointment.service.name}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  {format(appointment.startTime, "HH:mm")} – {format(appointment.endTime, "HH:mm")}
                </span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-500">{formatDuration(appointment.service.duration)}</span>
                {appointment.service.price > 0 && (
                  <>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs font-semibold text-gray-600">{formatPrice(appointment.service.price)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Window warning */}
        {tooLate ? (
          <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-5">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700">No podés reagendar este turno</p>
              <p className="mt-1 text-sm text-red-500">
                El plazo para reagendar es de {cancelHours} horas antes del turno.
                Quedan {Math.max(0, hoursUntil)} horas.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div>
              <h2 className="mb-1 font-bold text-gray-900">Elegí el nuevo horario</h2>
              <p className="text-sm text-gray-400">
                Seleccioná la nueva fecha y hora. Tu turno anterior quedará cancelado automáticamente.
              </p>
            </div>

            <RescheduleCalendar
              appointmentId={appointment.id}
              token={token}
              tenantId={appointment.tenantId}
              tenantSlug={slug}
              service={{
                id:       appointment.serviceId,
                name:     appointment.service.name,
                duration: appointment.service.duration,
                price:    appointment.service.price,
              }}
              availability={appointment.tenant.availability}
              accentColor={ac}
              locale={locale}
            />
          </>
        )}
      </div>
    </div>
  );
}

function ErrorPage({ slug, message, locale }: { slug: string; message: string; locale: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <AlertCircle className="mb-3 h-10 w-10 text-gray-300" />
      <h1 className="text-lg font-semibold text-gray-700">{message}</h1>
      <Link href={`/book/${slug}`} className="mt-4 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
        <ArrowLeft className="h-3.5 w-3.5" /> Volver
      </Link>
    </div>
  );
}
