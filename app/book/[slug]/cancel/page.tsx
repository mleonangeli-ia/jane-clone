import Link from "next/link";
import { ArrowLeft, RefreshCcw } from "lucide-react";

export default async function CancelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white">
      <div className="h-1.5 w-full bg-gray-200" />

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm text-center">
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <span className="text-4xl">😕</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">Pago no completado</h1>
          <p className="mt-3 text-gray-500">
            No se realizó ningún cobro y el horario fue liberado.
            <br />
            Podés intentarlo de nuevo cuando quieras.
          </p>

          {/* Card */}
          <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">¿Qué pasó?</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-500">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300 mt-1.5" />
                El pago fue cancelado o no se completó
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300 mt-1.5" />
                No se realizó ningún cargo en tu cuenta
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300 mt-1.5" />
                El turno quedó disponible para ser reservado nuevamente
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="mt-6 space-y-3">
            <Link href={`/book/${slug}`}>
              <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-gray-800 hover:shadow-lg">
                <RefreshCcw className="h-4 w-4" />
                Intentar de nuevo
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
