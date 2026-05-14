import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { slug } = await params;
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    return <ErrorMessage slug={slug} />;
  }

  let appointment;
  try {
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    const appointmentId = stripeSession.metadata?.appointmentId;
    if (!appointmentId) throw new Error("No appointment in metadata");

    appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { service: true, tenant: true, client: true },
    });
  } catch {
    return <ErrorMessage slug={slug} />;
  }

  if (!appointment) return <ErrorMessage slug={slug} />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">¡Turno confirmado!</h1>
        <p className="mt-2 text-gray-500">
          Tu pago fue procesado y el turno está reservado.
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
            <div className="flex justify-between">
              <dt className="text-gray-500">Total pagado</dt>
              <dd className="font-bold text-green-600">{formatPrice(appointment.service.price)}</dd>
            </div>
          </dl>
        </div>

        <p className="mt-4 text-sm text-gray-400">
          Se envió una confirmación a {appointment.client.email}
        </p>

        <div className="mt-6">
          <Link href={`/book/${slug}`}>
            <Button variant="outline" className="w-full">
              Reservar otro turno
            </Button>
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
        <h1 className="text-xl font-semibold text-gray-900">No se pudo verificar el pago</h1>
        <p className="mt-2 text-gray-500">Por favor contactá al profesional.</p>
        <Link href={`/book/${slug}`} className="mt-4 inline-block">
          <Button variant="outline">Volver</Button>
        </Link>
      </div>
    </div>
  );
}
