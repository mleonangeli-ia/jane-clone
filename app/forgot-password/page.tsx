"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    // Siempre mostramos éxito (no revelar si el email existe)
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-400 shadow-md shadow-sky-200/60">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <span className="text-[15px] font-bold text-gray-800">JaneClone</span>
        </div>

        {sent ? (
          /* ── Enviado ─────────────────────────────────────── */
          <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
            <div className="flex flex-col items-center px-8 py-10 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-7 w-7 text-emerald-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Revisá tu email</h2>
              <p className="mt-2 text-sm text-gray-500">
                Si existe una cuenta con <strong>{email}</strong>, vas a recibir un link para
                restablecer tu contraseña en los próximos minutos.
              </p>
              <p className="mt-3 text-xs text-gray-400">El link expira en 1 hora.</p>
            </div>
          </div>
        ) : (
          /* ── Formulario ─────────────────────────────────── */
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Olvidé mi contraseña</h1>
              <p className="mt-1 text-sm text-gray-500">
                Ingresá tu email y te enviamos un link para crear una nueva.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-4 p-6">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <Mail className="h-3 w-3" /> Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="vos@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-xl"
                    autoComplete="email"
                  />
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-sky-600 disabled:opacity-60"
                >
                  {loading ? "Enviando..." : "Enviar link de recuperación"}
                </button>
              </form>
            </div>
          </>
        )}

        <Link
          href="/login"
          className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-400 transition-colors hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}
