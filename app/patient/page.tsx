"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar, Mail, ArrowRight, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ERROR_MSGS: Record<string, string> = {
  invalid:  "El link no es válido. Solicitá uno nuevo.",
  used:     "Este link ya fue utilizado. Solicitá uno nuevo.",
  expired:  "El link expiró. Solicitá uno nuevo.",
};

export default function PatientLoginPage() {
  return (
    <Suspense>
      <PatientLoginForm />
    </Suspense>
  );
}

function PatientLoginForm() {
  const searchParams = useSearchParams();
  const errorKey     = searchParams.get("error") ?? "";

  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await fetch("/api/patient/auth/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);
    setSent(true);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400 shadow-lg shadow-sky-200/60">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-sky-600">JaneClone</p>
            <h1 className="mt-0.5 text-2xl font-bold text-gray-900">Portal del paciente</h1>
            <p className="mt-1 text-sm text-gray-500">Accedé a tu historial de turnos</p>
          </div>
        </div>

        {errorKey && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {ERROR_MSGS[errorKey] ?? "Ocurrió un error. Intentá de nuevo."}
          </div>
        )}

        {sent ? (
          <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
            <div className="flex flex-col items-center px-8 py-10 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-7 w-7 text-emerald-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">¡Revisá tu email!</h2>
              <p className="mt-2 text-sm text-gray-500">
                Enviamos un link de acceso a <strong>{email}</strong>.
                <br />Hacé clic en el link para ingresar.
              </p>
              <p className="mt-3 text-xs text-gray-400">El link expira en 15 minutos.</p>
              <button
                onClick={() => setSent(false)}
                className="mt-5 text-xs text-sky-600 hover:underline"
              >
                Usar otro email
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <Mail className="h-3 w-3" /> Tu email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl"
                  autoComplete="email"
                />
              </div>

              <p className="text-xs text-gray-400">
                Te enviaremos un link de acceso. Sin contraseña.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-sky-600 disabled:opacity-60"
              >
                {loading ? "Enviando..." : (
                  <>Enviar link de acceso <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </form>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-gray-400">
          ¿Sos profesional?{" "}
          <a href="/login" className="text-sky-600 hover:underline">Iniciar sesión acá</a>
        </p>
      </div>
    </div>
  );
}
