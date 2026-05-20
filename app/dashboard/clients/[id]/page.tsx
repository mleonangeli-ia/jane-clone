import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Calendar, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { ClientEditForm } from "@/components/clients/ClientEditForm";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const tenantId = session!.user.id;
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      appointments: {
        include: {
          service: true,
          intakeResponse: {
            include: { answers: { include: { field: true } } },
          },
        },
        orderBy: { startTime: "desc" },
      },
    },
  });

  if (!client || client.tenantId !== tenantId) notFound();

  const totalAppointments = client.appointments.length;
  const totalPaid = client.appointments
    .filter((a) => a.paymentStatus === "PAID")
    .reduce((sum, a) => sum + a.service.price, 0);

  const grouped = client.appointments.reduce<Record<string, typeof client.appointments>>(
    (acc, apt) => {
      const key = format(apt.startTime, "yyyy-MM-dd");
      if (!acc[key]) acc[key] = [];
      acc[key].push(apt);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/clients" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-4 lg:col-span-1">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{totalAppointments}</p>
                <p className="text-xs text-gray-500 mt-1">Turnos totales</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-lg font-bold text-indigo-600">{formatPrice(totalPaid)}</p>
                <p className="text-xs text-gray-500 mt-1">Total cobrado</p>
              </CardContent>
            </Card>
          </div>

          {/* Contact info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="truncate">{client.email}</span>
              </div>
              {client.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                  <span>{client.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>Cliente desde {format(client.createdAt, "d 'de' MMMM yyyy", { locale: es })}</span>
              </div>
            </CardContent>
          </Card>

          {/* Edit form */}
          <ClientEditForm
            id={client.id}
            name={client.name}
            phone={client.phone}
            notes={client.notes}
          />
        </div>

        {/* Right column — appointments */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Historial de turnos</h2>
          {Object.keys(grouped).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-400">
                Este cliente no tiene turnos registrados.
              </CardContent>
            </Card>
          ) : (
            Object.entries(grouped).map(([date, apts]) => (
              <div key={date}>
                <h3 className="mb-2 text-sm font-medium uppercase tracking-wider text-gray-400">
                  {format(new Date(date + "T12:00:00"), "EEEE d 'de' MMMM", { locale: es })}
                </h3>
                <div className="space-y-2">
                  {apts.map((apt) => (
                    <Card key={apt.id}>
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-8 w-1 rounded-full shrink-0"
                              style={{ backgroundColor: apt.service.color }}
                            />
                            <div>
                              <p className="font-medium text-sm text-gray-900">{apt.service.name}</p>
                              <p className="text-xs text-gray-500">
                                {format(apt.startTime, "HH:mm")} – {format(apt.endTime, "HH:mm")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">
                              {formatPrice(apt.service.price)}
                            </span>
                            <AppointmentStatusBadge status={apt.status} />
                          </div>
                        </div>
                        {apt.intakeResponse && apt.intakeResponse.submittedAt !== null && (
                          <div className="mt-2 pl-4">
                            <details className="text-xs">
                              <summary className="cursor-pointer inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700 font-medium hover:bg-indigo-100">
                                Formulario completado
                              </summary>
                              <ul className="mt-2 space-y-1 pl-2">
                                {apt.intakeResponse.answers.map((a) => (
                                  <li key={a.id} className="text-gray-600">
                                    <span className="font-medium text-gray-700">{a.field.label}:</span>{" "}
                                    {a.value}
                                  </li>
                                ))}
                              </ul>
                            </details>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function AppointmentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
    PENDING: { label: "Pendiente", variant: "warning" },
    CONFIRMED: { label: "Confirmado", variant: "success" },
    CANCELLED: { label: "Cancelado", variant: "destructive" },
    COMPLETED: { label: "Completado", variant: "secondary" },
    NO_SHOW: { label: "No asistió", variant: "destructive" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "secondary" };
  return <Badge variant={variant}>{label}</Badge>;
}
