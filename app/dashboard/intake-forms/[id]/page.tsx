import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { IntakeFormEditor } from "@/components/intake/IntakeFormEditor";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function IntakeFormDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const tenantId = session!.user.id;
  const { id } = await params;

  const form = await prisma.intakeForm.findUnique({
    where: { id },
    include: {
      fields: { orderBy: { position: "asc" } },
    },
  });

  if (!form || form.tenantId !== tenantId) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/intake-forms"
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{form.name}</h1>
      </div>

      <IntakeFormEditor form={form} />
    </div>
  );
}
