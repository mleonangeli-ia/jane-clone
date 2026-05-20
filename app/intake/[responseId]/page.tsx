import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyIntakeToken } from "@/lib/intake-token";
import { IntakeFillForm } from "@/components/intake/IntakeFillForm";

export default async function IntakePublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ responseId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { responseId } = await params;
  const { token } = await searchParams;

  if (!token) notFound();

  const response = await prisma.formResponse.findUnique({
    where: { id: responseId },
    include: {
      form: {
        include: { fields: { orderBy: { position: "asc" } } },
      },
      appointment: {
        include: {
          service: { select: { name: true } },
          tenant: { select: { name: true } },
        },
      },
    },
  });

  if (!response) notFound();

  if (!verifyIntakeToken(token, response.id, response.createdAt)) notFound();

  const professional = response.appointment.tenant.name;
  const serviceName = response.appointment.service.name;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-xl px-4 py-5">
          <p className="text-sm text-gray-500">{professional}</p>
          <h1 className="text-lg font-semibold text-gray-900">{serviceName}</h1>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-4 py-8">
        {response.submittedAt !== null ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Ya completaste este formulario.
            </h2>
            <p className="mt-2 text-gray-500">¡Gracias!</p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold text-gray-900">{response.form.name}</h2>
            <IntakeFillForm
              responseId={response.id}
              token={token}
              form={{
                name: response.form.name,
                description: response.form.description,
                fields: response.form.fields,
              }}
              professional={professional}
              serviceName={serviceName}
            />
          </div>
        )}
      </div>
    </div>
  );
}
