"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Loader2, CheckCircle, Calendar, Clock, User, Mail, Phone, MessageSquare, Tag } from "lucide-react";
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
  const [done, setDone] = useState(false);
  const [clientName, setClientName] = useState("");

  const startTime = new Date(date);
  const [h, m] = time.split(":").map(Number);
  startTime.setHours(h, m, 0, 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const data = new FormData(e.currentTarget);
    const name = data.get("name") as string;
    setClientName(name);

    const aptRes = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId,
        serviceId: service.id,
        startTime: startTime.toISOString(),
        clientName: name,
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

    if (!aptJson.requiresPayment) {
      setDone(true);
      setLoading(false);
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

    window.location.href = checkoutJson.url;
  }

  // ── Success screen ──────────────────────────────────────────────
  if (done) {
    return (
      <div className="animate-fade-up space-y-6">
        {/* Big checkmark */}
        <div className="flex flex-col items-center py-8 text-center">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            <CheckCircle className="h-10 w-10" style={{ color: accentColor }} />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">¡Turno confirmado!</h2>
          <p className="mt-2 text-gray-500">
            Te esperamos el{" "}
            <span className="font-medium text-gray-700">
              {format(startTime, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })}
            </span>
          </p>
        </div>

        {/* Appointment card */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="h-1" style={{ backgroundColor: accentColor }} />
          <div className="space-y-3 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Servicio</span>
              <span className="font-semibold text-gray-900">{service.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Duración</span>
              <span className="text-gray-700">{formatDuration(service.duration)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Fecha</span>
              <span className="text-gray-700">{format(startTime, "d MMM yyyy", { locale: es })}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Hora</span>
              <span className="font-semibold text-gray-700">{format(startTime, "HH:mm")}</span>
            </div>
          </div>
          <div
            className="flex items-center gap-2 px-5 py-3 text-sm font-medium text-white"
            style={{ backgroundColor: accentColor }}
          >
            <CheckCircle className="h-4 w-4" />
            Confirmación enviada por email
          </div>
        </div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-gray-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Cambiar horario
      </button>

      {/* Booking summary pill */}
      <div
        className="flex flex-wrap items-center gap-2 rounded-2xl p-4 text-white"
        style={{ backgroundColor: accentColor }}
      >
        <div className="flex items-center gap-1.5 text-sm">
          <Calendar className="h-4 w-4 opacity-80" />
          <span className="capitalize">{format(startTime, "EEEE d MMM", { locale: es })}</span>
        </div>
        <div className="h-4 w-px bg-white/30" />
        <div className="flex items-center gap-1.5 text-sm">
          <Clock className="h-4 w-4 opacity-80" />
          <span>{format(startTime, "HH:mm")}</span>
        </div>
        <div className="h-4 w-px bg-white/30" />
        <div className="flex items-center gap-1.5 text-sm">
          <Clock className="h-4 w-4 opacity-80" />
          <span>{formatDuration(service.duration)}</span>
        </div>
        {service.price > 0 && (
          <>
            <div className="h-4 w-px bg-white/30" />
            <div className="flex items-center gap-1.5 text-sm font-bold">
              <Tag className="h-4 w-4 opacity-80" />
              <span>{formatPrice(service.price)}</span>
            </div>
          </>
        )}
      </div>

      {/* Form card */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-50 px-5 py-4">
          <h3 className="font-semibold text-gray-900">Tus datos</h3>
          <p className="text-sm text-gray-500">Para confirmar tu turno necesitamos tu info</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <User className="h-3 w-3" /> Nombre completo
            </Label>
            <Input id="name" name="name" required placeholder="Juan Pérez" className="h-11 rounded-xl" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <Mail className="h-3 w-3" /> Email
            </Label>
            <Input id="email" name="email" type="email" required placeholder="juan@ejemplo.com" className="h-11 rounded-xl" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <Phone className="h-3 w-3" /> Teléfono <span className="normal-case font-normal text-gray-400">(opcional)</span>
            </Label>
            <Input id="phone" name="phone" placeholder="+54 11 1234-5678" className="h-11 rounded-xl" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <MessageSquare className="h-3 w-3" /> Comentarios <span className="normal-case font-normal text-gray-400">(opcional)</span>
            </Label>
            <Input id="notes" name="notes" placeholder="Alguna consulta o aclaración..." className="h-11 rounded-xl" />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-semibold text-white shadow-md transition-all hover:shadow-lg hover:opacity-95 disabled:opacity-60"
            style={{ backgroundColor: accentColor }}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {service.price > 0 ? "Redirigiendo a MercadoPago..." : "Confirmando..."}
              </>
            ) : service.price > 0 ? (
              `Ir a pagar · ${formatPrice(service.price)}`
            ) : (
              "Confirmar turno"
            )}
          </button>

          {service.price > 0 && (
            <p className="text-center text-xs text-gray-400">
              Serás redirigido a MercadoPago para completar el pago de forma segura
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
