"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, ArrowLeft, Lock, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const token        = searchParams.get("token") ?? "";

  const [password,  setPassword]  = useState("");
  const [password2, setPassword2] = useState("");
  const [showPwd,   setShowPwd]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [done,      setDone]      = useState(false);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm text-center">
          <p className="text-gray-500">Link inválido. Solicitá uno nuevo.</p>
          <Link href="/forgot-password" className="mt-4 inline-block text-sm font-medium text-sky-600 hover:underline">
            Solicitar nuevo link
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (password !== password2) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Ocurrió un error. Intentá de nuevo.");
      setLoading(false);
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/login"), 3000);
  }

  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const strengthLabel = ["", "Débil", "Buena", "Fuerte"];
  const strengthColor = ["", "bg-red-400", "bg-yellow-400", "bg-emerald-400"];

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

        {done ? (
          /* ── Éxito ───────────────────────────────────────── */
          <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
            <div className="flex flex-col items-center px-8 py-10 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-7 w-7 text-emerald-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">¡Contraseña actualizada!</h2>
              <p className="mt-2 text-sm text-gray-500">
                Tu contraseña fue cambiada exitosamente.
                <br />En unos segundos te redirigimos al login.
              </p>
            </div>
          </div>
        ) : (
          /* ── Formulario ─────────────────────────────────── */
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Nueva contraseña</h1>
              <p className="mt-1 text-sm text-gray-500">Elegí una contraseña segura para tu cuenta.</p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-4 p-6">
                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <Lock className="h-3 w-3" /> Nueva contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPwd ? "text" : "password"}
                      required
                      minLength={8}
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 rounded-xl pr-10"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {password.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex flex-1 gap-1">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all ${
                              i <= strength ? strengthColor[strength] : "bg-gray-100"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-gray-400">{strengthLabel[strength]}</span>
                    </div>
                  )}
                </div>

                {/* Confirm */}
                <div className="space-y-1.5">
                  <Label htmlFor="password2" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <Lock className="h-3 w-3" /> Confirmar contraseña
                  </Label>
                  <Input
                    id="password2"
                    type={showPwd ? "text" : "password"}
                    required
                    placeholder="Repetí la contraseña"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    className={`h-11 rounded-xl ${
                      password2.length > 0 && password !== password2
                        ? "border-red-300 ring-1 ring-red-200"
                        : password2.length > 0 && password === password2
                        ? "border-emerald-300 ring-1 ring-emerald-200"
                        : ""
                    }`}
                    autoComplete="new-password"
                  />
                  {password2.length > 0 && password !== password2 && (
                    <p className="text-xs text-red-500">Las contraseñas no coinciden</p>
                  )}
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading || (password2.length > 0 && password !== password2)}
                  className="w-full rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-sky-600 disabled:opacity-60"
                >
                  {loading ? "Guardando..." : "Guardar nueva contraseña"}
                </button>
              </form>
            </div>
          </>
        )}

        <Link href="/login" className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-400 transition-colors hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}
