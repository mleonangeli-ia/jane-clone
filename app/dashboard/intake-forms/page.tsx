import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { IntakeFormDialog } from "@/components/intake/IntakeFormDialog";
import Link from "next/link";
import { ClipboardList } from "lucide-react";

export default async function IntakeFormsPage() {
  const session = await getServerSession(authOptions);
  const tenantId = session!.user.id;

  const forms = await prisma.intakeForm.findMany({
    where: { tenantId },
    include: {
      fields: true,
      _count: { select: { responses: true, services: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Intake Forms</h1>
        <IntakeFormDialog />
      </div>

      {forms.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-400">
            No tenés formularios creados. Creá uno para adjuntarlo a un servicio.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <Card key={form.id}>
              <CardContent className="p-6">
                <div className="mb-3 flex items-start gap-3">
                  <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{form.name}</h3>
                    {form.description && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{form.description}</p>
                    )}
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-3 text-xs text-gray-500">
                  <span>{form.fields.length} pregunta{form.fields.length !== 1 ? "s" : ""}</span>
                  <span>{form._count.responses} respuesta{form._count.responses !== 1 ? "s" : ""}</span>
                  <span>{form._count.services} servicio{form._count.services !== 1 ? "s" : ""}</span>
                </div>

                <Link
                  href={`/dashboard/intake-forms/${form.id}`}
                  className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Editar
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
