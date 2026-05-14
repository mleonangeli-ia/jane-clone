import { prisma } from "@/lib/db";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { CheckCircle, Clock, Calendar, MapPin, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ appointment_id?: string; pending?: string }>;
}) {
  const { slug } = await params;
  const { appointment_id, pending } = await searchParams;

  if (!appointment_id) return <ErrorMessage slug={slug} />;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointment_id },
    include: { service: true, tenant: true, client: true },
  }).catch(() => null);

  if (!appointment) return <ErrorMessage slug={slug} />;

  const isPending = pending === "1";
  const accent = appointment.tenant.accentColor;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Top accent bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />

      <div className="mx-auto max-w-lg px-4 py-12">
        {/* Icon + title */}
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full"
            style={{ backgroundColor: `${isPending ? "#f59e0b" : accent}18` }}
          >
            {isPending ? (
              <Clock className="h-12 w-12 text-amber-500" />
            ) : (
              <CheckCircle className="h-12 w-12" style={{ color: accent }} />
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            {isPending ? "Pago en proceso" : "¡Turno confirmado!"}
          </h1>
          <p className="mt-2 text-gray-500">
            {isPending
              ? "Tu pago está siendo procesado. Te avisaremos cuando se confirme."
              : `Hola ${appointment.client.name?.split(" ")[0]}, tu turno quedó reservado.`}
          </p>
        </div>

        {/* Appointment card */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
          {/* Header */}
          <div className="p-5" style={{ background: `linear-gradient(135deg, ${accent}22, ${accent}08)` }}>
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white"
                style={{ backgroundColor: accent }}
              >
                {appointment.tenant.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{appointment.tenant.name}</p>
                <p className="text-sm text-gray-500">{appointment.service.name}</p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="divide-y divide-gray-50 px-5">
            <div className="flex items-center gap-3 py-3.5">
              <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
              <span className="text-sm text-gray-500">Fecha y hora</span>
              <span className="ml-auto text-sm font-semibold text-gray-900 capitalize">
                {format(appointment.startTime, "EEEE d 'de' MMMM", { locale: es })}
                {" · "}
                {format(appointment.startTime, "HH:mm")}
              </span>
            </div>
            {appointment.tenant.address && (
              <div className="flex items-center gap-3 py-3.5">
                <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="text-sm text-gray-500">Lugar</span>
                <span className="ml-auto text-right text-sm font-medium text-gray-900">{appointment.tenant.address}</span>
              </div>
            )}
            {appointment.service.price > 0 && (
              <div className="flex items-center gap-3 py-3.5">
                <div className="h-4 w-4 shrink-0 flex items-center justify-center">
                  <span className="text-xs text-gray-400">$</span>
                </div>
                <span className="text-sm text-gray-500">Total</span>
                <span
                  className="ml-auto text-sm font-bold"
                  style={{ color: isPending ? "#f59e0b" : accent }}
                >
                  {formatPrice(appointment.service.price)}
                  {isPending && <span className="ml-1 text-xs font-normal text-gray-400">(pendiente)</span>}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-5 py-3.5">
            <p className="text-center text-xs text-gray-400">
              Confirmación enviada a <span className="font-medium text-gray-600">{appointment.client.email}</span>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <Link href={`/book/${slug}`}>
            <button
              className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:opacity-95"
              style={{ backgroundColor: accent }}
            >
              Reservar otro turno
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorMessage({ slug }: { slug: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <span className="text-2xl">!</span>
      </div>
      <h1 className="text-xl font-semibold text-gray-900">No se pudo verificar el turno</h1>
      <p className="mt-2 text-gray-500">Por favor contactá al profesional.</p>
      <Link href={`/book/${slug}`} className="mt-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>
    </div>
  );
}
