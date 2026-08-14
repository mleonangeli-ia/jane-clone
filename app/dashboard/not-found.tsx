import Link from "next/link";
import { SearchX } from "lucide-react";

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: "var(--bg-subtle)" }}
      >
        <SearchX className="h-7 w-7" style={{ color: "var(--text-muted)" }} />
      </div>
      <div>
        <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
          Página no encontrada
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          El recurso que buscás no existe o fue eliminado.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all"
        style={{ backgroundColor: "#0f766e" }}
      >
        Volver al inicio
      </Link>
    </div>
  );
}
