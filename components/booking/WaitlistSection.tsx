"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  tenantId: string;
  serviceId: string;
  date: string;
  accentColor: string;
};

export function WaitlistSection({ tenantId, serviceId, date, accentColor }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, serviceId, date, name, email, phone: phone || undefined }),
    });

    setSubmitting(false);

    if (res.status === 409) {
      setError("Ya estás anotado en la lista para este día.");
      return;
    }

    if (!res.ok) {
      setError("Ocurrió un error. Intentá de nuevo.");
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-700">
          ¡Listo! Te anotamos en la lista de espera.
        </p>
        <p className="mt-1 text-xs text-gray-400">Te avisamos si se libera un turno.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
      <p className="mb-1 text-sm font-semibold text-gray-700">Sin horarios disponibles</p>
      <p className="mb-4 text-xs text-gray-400">Anotate en la lista de espera y te avisamos si se libera un turno.</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="wl-name">Nombre</Label>
          <Input
            id="wl-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Tu nombre"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="wl-email">Email</Label>
          <Input
            id="wl-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="tu@email.com"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="wl-phone">Teléfono <span className="text-gray-400">(opcional)</span></Label>
          <Input
            id="wl-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+54 11 1234-5678"
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: accentColor }}
        >
          {submitting ? "Enviando..." : "Anotarme en lista de espera"}
        </button>
      </form>
    </div>
  );
}
