"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getT, type Locale } from "@/lib/i18n";

type Props = {
  tenantId: string;
  serviceId: string;
  date: string;
  accentColor: string;
  locale?: Locale;
};

export function WaitlistSection({ tenantId, serviceId, date, accentColor, locale = "es" }: Props) {
  const tw = getT(locale).waitlist;

  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, serviceId, date, name, email, phone: phone || undefined, _hp: "" }),
    });

    setSubmitting(false);

    if (res.status === 409) { setError(tw.alreadyJoined); return; }
    if (!res.ok) { setError(locale === "en" ? "An error occurred. Please try again." : locale === "pt" ? "Ocorreu um erro. Tente novamente." : "Ocurrió un error. Intentá de nuevo."); return; }

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
        <p className="text-sm font-medium text-gray-700">{tw.joined}</p>
        <p className="mt-1 text-xs text-gray-400">{tw.joinedSub}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center py-4 text-center">
        <p className="text-sm font-semibold text-gray-700">{tw.title}</p>
        <p className="mt-1 text-xs text-gray-400">{tw.sub}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="wl-name">{tw.name}</Label>
          <Input id="wl-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="wl-email">{tw.email}</Label>
          <Input id="wl-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="wl-phone">{tw.phone} <span className="text-gray-400">{getT(locale).form.optional}</span></Label>
          <Input id="wl-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: accentColor }}
        >
          {submitting ? tw.joining : tw.join}
        </button>
      </form>
    </div>
  );
}
