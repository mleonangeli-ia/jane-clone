import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { BookingCalendar } from "@/components/booking/BookingCalendar";
import { formatPrice, formatDuration } from "@/lib/utils";
import { Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function BookingServicePage({
  params,
}: {
  params: Promise<{ slug: string; serviceId: string }>;
}) {
  const { slug, serviceId } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { availability: { where: { isActive: true } } },
  });

  if (!tenant) notFound();

  const service = await prisma.service.findFirst({
    where: { id: serviceId, tenantId: tenant.id, isActive: true },
  });

  if (!service) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Link
          href={`/book/${slug}`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>

        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-1.5 rounded-full" style={{ backgroundColor: service.color }} />
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">{service.name}</h1>
              <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDuration(service.duration)}
                </span>
                <span className="font-semibold text-gray-800">{formatPrice(service.price)}</span>
              </div>
            </div>
          </div>
        </div>

        <h2 className="mb-4 text-lg font-semibold text-gray-700">Elegí fecha y hora</h2>

        <BookingCalendar
          tenantId={tenant.id}
          tenantSlug={slug}
          service={{ id: service.id, name: service.name, duration: service.duration, price: service.price }}
          availability={tenant.availability}
          accentColor={tenant.accentColor}
        />
      </div>
    </div>
  );
}
