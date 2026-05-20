"use client";

import { useState } from "react";

type Props = {
  appointmentId: string;
  token: string;
};

export function SelfCancelButton({ appointmentId, token }: Props) {
  const [loading, setLoading] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/appointments/cancel-public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: appointmentId, token }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Error al cancelar");
      }
      setCancelled(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cancelar");
    } finally {
      setLoading(false);
    }
  }

  if (cancelled) {
    return (
      <div className="mt-6 rounded-2xl bg-green-50 border border-green-100 p-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <span className="text-2xl">✓</span>
        </div>
        <p className="font-semibold text-green-800">Tu turno fue cancelado exitosamente.</p>
        <p className="mt-1 text-sm text-green-600">No realizamos ningún cobro.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {error && (
        <p className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 text-center">
          {error}
        </p>
      )}
      <button
        onClick={handleCancel}
        disabled={loading}
        className="w-full rounded-2xl bg-red-500 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-red-600 hover:shadow-lg disabled:opacity-60"
      >
        {loading ? "Cancelando..." : "Cancelar turno"}
      </button>
    </div>
  );
}
