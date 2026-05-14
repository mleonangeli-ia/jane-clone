import Link from "next/link";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default async function CancelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">Pago cancelado</h1>
        <p className="mt-2 text-gray-500">
          No se realizó ningún cobro. El turno fue liberado.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link href={`/book/${slug}`}>
            <Button className="w-full">Volver a elegir turno</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
