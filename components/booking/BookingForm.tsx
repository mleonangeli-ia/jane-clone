"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es, enUS, ptBR } from "date-fns/locale";
import { ArrowLeft, Loader2, CheckCircle, Calendar, Clock, User, Mail, Phone, MessageSquare, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice, formatDuration } from "@/lib/utils";
import { getT, type Locale } from "@/lib/i18n";

const DATE_FNS: Record<Locale, object> = { es, en: enUS, pt: ptBR };

type Props = {
  tenantId: string;
  service: { id: string; name: string; duration: number; price: number };
  date: Date;
  time: string;
  accentColor: string;
  locale?: Locale;
  onBack: () => void;
};

export function BookingForm({ tenantId, service, date, time, accentColor, locale = "es", onBack }: Props) {
  const t = getT(locale);
  const tf = t.form;
  const dateFnsLocale = DATE_FNS[locale] as Parameters<typeof format>[2]["locale"];

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [done, setDone]       = useState(false);

  const startTime = new Date(date);
  const [h, m] = time.split(":").map(Number);
  startTime.setHours(h, m, 0, 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const data = new FormData(e.currentTarget);

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
      setError(aptJson.error || tf.errGeneric);
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
      setError(tf.errPayment);
      setLoading(false);
      return;
    }

    window.location.href = checkoutJson.url;
  }

  // ── Success ────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="animate-fade-up space-y-6">
        <div className="flex flex-col items-center py-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: `${accentColor}20` }}>
            <CheckCircle className="h-10 w-10" style={{ color: accentColor }} />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">{tf.confirmTitle}</h2>
          <p className="mt-2 text-gray-500">
            {tf.confirmSub}{" "}
            <span className="font-medium text-gray-700">
              {format(startTime, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: dateFnsLocale })}
            </span>
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="h-1" style={{ backgroundColor: accentColor }} />
          <div className="space-y-3 p-5">
            {[
              [tf.labelService, service.name],
              [locale === "es" ? "Duración" : locale === "en" ? "Duration" : "Duração", formatDuration(service.duration)],
              [locale === "es" ? "Fecha" : locale === "en" ? "Date" : "Data", format(startTime, "d MMM yyyy", { locale: dateFnsLocale })],
              [locale === "es" ? "Hora" : "Time", format(startTime, "HH:mm")],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="font-semibold text-gray-900">{value}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 px-5 py-3 text-sm font-medium text-white" style={{ backgroundColor: accentColor }}>
            <CheckCircle className="h-4 w-4" />
            {tf.confirmEmailSent}
          </div>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-gray-600">
        <ArrowLeft className="h-4 w-4" />
        {tf.changeTime}
      </button>

      {/* Summary pill */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl p-4 text-white" style={{ backgroundColor: accentColor }}>
        <div className="flex items-center gap-1.5 text-sm">
          <Calendar className="h-4 w-4 opacity-80" />
          <span className="capitalize">{format(startTime, "EEEE d MMM", { locale: dateFnsLocale })}</span>
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
          <h3 className="font-semibold text-gray-900">{tf.title}</h3>
          <p className="text-sm text-gray-500">{tf.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <User className="h-3 w-3" /> {tf.name}
            </Label>
            <Input id="name" name="name" required placeholder={tf.namePlaceholder} className="h-11 rounded-xl" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <Mail className="h-3 w-3" /> {tf.email}
            </Label>
            <Input id="email" name="email" type="email" required placeholder="email@ejemplo.com" className="h-11 rounded-xl" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <Phone className="h-3 w-3" /> {tf.phone} <span className="normal-case font-normal text-gray-400">{tf.optional}</span>
            </Label>
            <Input id="phone" name="phone" className="h-11 rounded-xl" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <MessageSquare className="h-3 w-3" /> {tf.notes} <span className="normal-case font-normal text-gray-400">{tf.optional}</span>
            </Label>
            <Input id="notes" name="notes" placeholder={tf.notesPlaceholder} className="h-11 rounded-xl" />
          </div>

          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-semibold text-white shadow-md transition-all hover:shadow-lg hover:opacity-95 disabled:opacity-60"
            style={{ backgroundColor: accentColor }}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {service.price > 0 ? tf.submittingPayment : tf.submitting}
              </>
            ) : tf.submit(service.price, formatPrice(service.price))}
          </button>

          {service.price > 0 && (
            <p className="text-center text-xs text-gray-400">{tf.mpDisclaimer}</p>
          )}
        </form>
      </div>
    </div>
  );
}
