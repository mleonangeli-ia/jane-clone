import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyCancelToken } from "@/lib/cancel-token";
import { differenceInHours, format } from "date-fns";
import { es } from "date-fns/locale";
import { SelfCancelButton } from "@/components/booking/SelfCancelButton";
import { Calendar, Clock, MapPin, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

export default async function SelfCancelPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ id?: string; token?: string }>;
}) {
  const { slug } = await params;
  const { id, token } = await searchParams;

  if (!id || !token) notFound();

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { client: true, service: true, tenant: true },
  });

  if (!appointment || appointment.tenant.slug !== slug) notFound();

  if (!verifyCancelToken(token, id, appointment.createdAt)) notFound();

  const accent = appointment.tenant.accentColor;
  const alreadyCancelled = appointment.status === "CANCELLED";
  const isPast = new Date() > appointment.startTime;
  const hoursLeft = differenceInHours(appointment.startTime, new Date());
  const windowClosed = hoursLeft < appointment.tenant.cancelWindowHours;

  if (alreadyCancelled) {
    return (
      <StatusPage accent={accent} slug={slug}>
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
          <span className="text-3xl">✕</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Turno ya cancelado</h1>
        <p className="mt-2 text-gray-500">Este turno ya fue cancelado anteriormente.</p>
      </StatusPage>
    );
  }

  if (isPast) {
    return (
      <StatusPage accent={accent} slug={slug}>
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
          <Clock className="h-10 w-10 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Este turno ya ocurrió</h1>
        <p className="mt-2 text-gray-500">No es posible cancelar un turno pasado.</p>
      </StatusPage>
    );
  }

  if (windowClosed) {
    return (
      <StatusPage accent={accent} slug={slug}>
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
          <Clock className="h-10 w-10 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Plazo de cancelación vencido</h1>
        <p className="mt-2 text-gray-500">
          Solo se puede cancelar con al menos {appointment.tenant.cancelWindowHours}hs de anticipación.
        </p>
      </StatusPage>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />

      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: `${accent}18` }}
          >
            <Calendar className="h-10 w-10" style={{ color: accent }} />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Cancelar turno</h1>
          <p className="mt-2 text-gray-500">Revisá los datos antes de confirmar la cancelación.</p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
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
            <div className="flex items-center gap-3 py-3.5">
              <Clock className="h-4 w-4 shrink-0 text-gray-400" />
              <span className="text-sm text-gray-500">Duración</span>
              <span className="ml-auto text-sm font-semibold text-gray-900">
                {format(appointment.startTime, "HH:mm")} – {format(appointment.endTime, "HH:mm")}
              </span>
            </div>
            {appointment.tenant.address && (
              <div className="flex items-center gap-3 py-3.5">
                <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="text-sm text-gray-500">Lugar</span>
                <span className="ml-auto text-right text-sm font-medium text-gray-900">
                  {appointment.tenant.address}
                </span>
              </div>
            )}
            {appointment.service.price > 0 && (
              <div className="flex items-center gap-3 py-3.5">
                <div className="h-4 w-4 shrink-0 flex items-center justify-center">
                  <span className="text-xs text-gray-400">$</span>
                </div>
                <span className="text-sm text-gray-500">Total</span>
                <span className="ml-auto text-sm font-bold" style={{ color: accent }}>
                  {formatPrice(appointment.service.price, appointment.tenant.currency)}
                </span>
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-5 py-3.5">
            <p className="text-center text-xs text-gray-400">
              Cliente: <span className="font-medium text-gray-600">{appointment.client.name}</span>
            </p>
          </div>
        </div>

        <SelfCancelButton appointmentId={id} token={token} />

        <div className="mt-4 text-center">
          <Link href={`/book/${slug}`} className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatusPage({
  accent,
  slug,
  children,
}: {
  accent: string;
  slug: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white">
      <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm text-center">
          {children}
          <div className="mt-8">
            <Link href={`/book/${slug}`} className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-600">
              <ArrowLeft className="h-4 w-4" /> Volver
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
