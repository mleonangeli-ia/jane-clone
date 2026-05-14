import { prisma } from "@/lib/db";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className={`flex h-16 w-16 items-center justify-center rounded-full ${isPending ? "bg-yellow-100" : "bg-green-100"}`}>
            {isPending
              ? <Clock className="h-8 w-8 text-yellow-600" />
              : <CheckCircle className="h-8 w-8 text-green-600" />
            }
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">
          {isPending ? "Pago en proceso" : "¡Turno confirmado!"}
        </h1>
        <p className="mt-2 text-gray-500">
          {isPending
            ? "Tu pago está siendo procesado. Te avisaremos cuando se confirme."
            : "Tu pago fue acreditado y el turno está reservado."}
        </p>

        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 text-left">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Profesional</dt>
              <dd className="font-medium text-gray-900">{appointment.tenant.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Servicio</dt>
              <dd className="font-medium text-gray-900">{appointment.service.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Fecha y hora</dt>
              <dd className="font-medium text-gray-900">{formatDateTime(appointment.startTime)}</dd>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-3">
              <dt className="font-medium text-gray-700">Total</dt>
              <dd className={`font-bold ${isPending ? "text-yellow-600" : "text-green-600"}`}>
                {formatPrice(appointment.service.price)}
              </dd>
            </div>
          </dl>
        </div>

        <p className="mt-4 text-sm text-gray-400">
          Confirmación enviada a {appointment.client.email}
        </p>

        <div className="mt-6">
          <Link href={`/book/${slug}`}>
            <Button variant="outline" className="w-full">Reservar otro turno</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorMessage({ slug }: { slug: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-gray-900">No se pudo verificar el turno</h1>
        <p className="mt-2 text-gray-500">Por favor contactá al profesional.</p>
        <Link href={`/book/${slug}`} className="mt-4 inline-block">
          <Button variant="outline">Volver</Button>
        </Link>
      </div>
    </div>
  );
}
