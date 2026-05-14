"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice, formatDuration } from "@/lib/utils";

type Props = {
  tenantId: string;
  service: { id: string; name: string; duration: number; price: number };
  date: Date;
  time: string;
  accentColor: string;
  onBack: () => void;
};

export function BookingForm({ tenantId, service, date, time, accentColor, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startTime = new Date(date);
  const [h, m] = time.split(":").map(Number);
  startTime.setHours(h, m, 0, 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const data = new FormData(e.currentTarget);

    // Step 1: create the appointment (PENDING if price > 0)
    const aptRes = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId,
        serviceId: service.id,
        startTime: startTime.toISOString(),
        clientName: data.get("name"),
        clientEmail: data.get("email"),
        clientPhone: data.get("phone"),
        notes: data.get("notes"),
      }),
    });

    const aptJson = await aptRes.json();
    if (!aptRes.ok) {
      setError(aptJson.error || "Error al reservar el turno.");
      setLoading(false);
      return;
    }

    // Step 2: if free, done; if paid, go to MercadoPago
    if (!aptJson.requiresPayment) {
      window.location.href = "?confirmed=1";
      return;
    }

    const checkoutRes = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId: aptJson.id }),
    });

    const checkoutJson = await checkoutRes.json();
    if (!checkoutRes.ok || !checkoutJson.url) {
      setError("No se pudo iniciar el pago. Intentá de nuevo.");
      setLoading(false);
      return;
    }

    // Redirect to MercadoPago Checkout
    window.location.href = checkoutJson.url;
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Cambiar horario
      </button>

      {/* Summary */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-3 font-semibold text-gray-900">Resumen del turno</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Servicio</dt>
            <dd className="font-medium text-gray-900">{service.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Duración</dt>
            <dd className="text-gray-700">{formatDuration(service.duration)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Fecha y hora</dt>
            <dd className="text-gray-700">
              {format(startTime, "EEEE d MMM 'a las' HH:mm", { locale: es })}
            </dd>
          </div>
          {service.price > 0 && (
            <div className="flex justify-between border-t border-gray-100 pt-2">
              <dt className="font-medium text-gray-700">Total a pagar</dt>
              <dd className="font-bold text-gray-900">{formatPrice(service.price)}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Form */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 font-semibold text-gray-900">Tus datos</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre completo</Label>
            <Input id="name" name="name" required placeholder="Juan Pérez" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="juan@ejemplo.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Teléfono (opcional)</Label>
            <Input id="phone" name="phone" placeholder="+54 11 1234-5678" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Comentarios (opcional)</Label>
            <Input id="notes" name="notes" placeholder="Alguna consulta o aclaración..." />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
            style={{ backgroundColor: accentColor }}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {service.price > 0 ? "Redirigiendo a pago..." : "Confirmando..."}
              </>
            ) : service.price > 0 ? (
              `Pagar ${formatPrice(service.price)}`
            ) : (
              "Confirmar turno gratis"
            )}
          </Button>

          {service.price > 0 && (
            <p className="text-center text-xs text-gray-400">
              Pago seguro procesado por MercadoPago
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
