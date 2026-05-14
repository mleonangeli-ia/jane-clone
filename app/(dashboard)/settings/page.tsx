import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SettingsForm } from "@/components/settings/SettingsForm";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const tenant = await prisma.tenant.findUnique({
    where: { id: session!.user.id },
    select: { id: true, name: true, email: true, slug: true, bio: true, phone: true, address: true, accentColor: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
      <SettingsForm tenant={tenant!} />
    </div>
  );
}
