"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [blocked, setBlocked]   = useState(false);
  const [retryMin, setRetryMin] = useState(0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (blocked) return;
    setLoading(true);
    setError("");

    const data = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: data.get("email"),
      password: data.get("password"),
      redirect: false,
    });

    if (!result?.error) {
      router.push("/dashboard");
      return;
    }

    // NextAuth encodes the error in the URL — decode it
    const raw = decodeURIComponent(result.error);

    if (raw.startsWith("RateLimit:")) {
      const min = parseInt(raw.split(":")[1] ?? "15", 10);
      setBlocked(true);
      setRetryMin(min);
      setError("");
    } else {
      setError("Email o contraseña incorrectos");
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold">JaneClone</span>
        </div>
        <div>
          <blockquote className="text-2xl font-light leading-relaxed text-indigo-100">
            "Desde que uso JaneClone mis pacientes reservan solos y yo me concentro en atender."
          </blockquote>
          <p className="mt-4 text-sm text-indigo-300">Lic. Florencia Lucchini — Psicóloga</p>
        </div>
        <div className="flex gap-8 text-indigo-200">
          <div>
            <p className="text-3xl font-bold text-white">500+</p>
            <p className="text-sm">Profesionales</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">50k+</p>
            <p className="text-sm">Turnos gestionados</p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">JaneClone</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Bienvenido de nuevo</h1>
            <p className="mt-1 text-gray-500">Ingresá a tu panel de gestión</p>
          </div>

          {/* Rate-limit block screen */}
          {blocked ? (
            <div className="overflow-hidden rounded-2xl border border-orange-200 bg-orange-50 shadow-sm">
              <div className="flex flex-col items-center px-8 py-10 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
                  <ShieldAlert className="h-7 w-7 text-orange-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Demasiados intentos</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Por seguridad bloqueamos temporalmente el acceso desde esta sesión.
                </p>
                <div className="mt-4 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-orange-600 ring-1 ring-orange-200">
                  Podés intentarlo de nuevo en ~{retryMin} min
                </div>
                <button
                  onClick={() => { setBlocked(false); setError(""); }}
                  className="mt-6 text-xs text-gray-400 underline hover:text-gray-600"
                >
                  Intentar de todas formas
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="vos@ejemplo.com"
                    className="h-11"
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="h-11"
                    autoComplete="current-password"
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="h-11 w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-md"
                  disabled={loading}
                >
                  {loading ? "Ingresando..." : "Iniciar sesión"}
                </Button>
              </form>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-gray-500">
            ¿No tenés cuenta?{" "}
            <Link href="/register" className="font-semibold text-indigo-600 hover:underline">
              Registrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
