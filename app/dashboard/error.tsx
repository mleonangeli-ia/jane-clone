"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: "var(--bg-subtle)" }}
      >
        <AlertTriangle className="h-7 w-7 text-amber-500" />
      </div>
      <div>
        <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
          Algo salió mal
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Ocurrió un error inesperado. Podés intentar de nuevo.
        </p>
      </div>
      <button
        onClick={reset}
        className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all"
        style={{ backgroundColor: "#0f766e" }}
      >
        Reintentar
      </button>
    </div>
  );
}
