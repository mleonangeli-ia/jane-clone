"use client";

import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, ShieldAlert, ShieldCheck } from "lucide-react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
  }
}

const SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA"; // Cloudflare test key (always passes)

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [blocked, setBlocked]   = useState(false);
  const [retryMin, setRetryMin] = useState(0);

  // CAPTCHA state
  const [showCaptcha, setShowCaptcha]       = useState(false);
  const [captchaToken, setCaptchaToken]     = useState("");
  const [captchaReady, setCaptchaReady]     = useState(false);
  const captchaRef    = useRef<HTMLDivElement>(null);
  const widgetIdRef   = useRef<string | null>(null);
  const savedEmail    = useRef("");
  const savedPassword = useRef("");

  // Load + render Turnstile when CAPTCHA is needed
  useEffect(() => {
    if (!showCaptcha || !captchaRef.current) return;

    function renderWidget() {
      if (!captchaRef.current) return;
      const id = window.turnstile?.render(captchaRef.current, {
        sitekey: SITE_KEY,
        theme: "light",
        callback: (token: string) => {
          setCaptchaToken(token);
          setCaptchaReady(true);
        },
        "expired-callback": () => {
          setCaptchaToken("");
          setCaptchaReady(false);
        },
        "error-callback": () => {
          setCaptchaToken("");
          setCaptchaReady(false);
        },
      });
      if (id) widgetIdRef.current = id;
    }

    if (window.turnstile) {
      renderWidget();
    } else {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.onload = renderWidget;
      document.head.appendChild(script);
    }

    return () => {
      if (widgetIdRef.current) {
        window.turnstile?.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [showCaptcha]);

  async function doSignIn(email: string, password: string, token = "") {
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      captchaToken: token,
      redirect: false,
    });

    if (!result?.error) {
      router.push("/dashboard");
      return;
    }

    const raw = decodeURIComponent(result.error);

    if (raw === "NeedsCaptcha") {
      savedEmail.current    = email;
      savedPassword.current = password;
      setShowCaptcha(true);
      setError("");
    } else if (raw.startsWith("RateLimit:")) {
      const min = parseInt(raw.split(":")[1] ?? "15", 10);
      setBlocked(true);
      setRetryMin(min);
      setError("");
    } else if (raw === "InvalidCaptcha") {
      setError("El CAPTCHA no es válido. Resolvelo de nuevo.");
      setCaptchaToken("");
      setCaptchaReady(false);
      if (widgetIdRef.current) window.turnstile?.reset(widgetIdRef.current);
    } else {
      setError("Email o contraseña incorrectos");
    }

    setLoading(false);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (blocked) return;

    const data     = new FormData(e.currentTarget);
    const email    = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");

    doSignIn(email, password, captchaToken);
  }

  function handleCaptchaRetry() {
    doSignIn(savedEmail.current, savedPassword.current, captchaToken);
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel ─────────────────────────────────────── */}
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
          <div><p className="text-3xl font-bold text-white">500+</p><p className="text-sm">Profesionales</p></div>
          <div><p className="text-3xl font-bold text-white">50k+</p><p className="text-sm">Turnos gestionados</p></div>
        </div>
      </div>

      {/* ── Right panel ────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-4 py-8 sm:px-6 sm:py-12">
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

          {/* ── Hard block screen ─────────────────────────── */}
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
                  Intentá de nuevo en ~{retryMin} min
                </div>
                <button
                  onClick={() => { setBlocked(false); setError(""); }}
                  className="mt-5 text-xs text-gray-400 underline hover:text-gray-600"
                >
                  Intentar de todas formas
                </button>
              </div>
            </div>

          ) : (
            /* ── Login form ───────────────────────────────── */
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-5 p-8">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email" name="email" type="email" required
                    placeholder="vos@ejemplo.com" className="h-11"
                    autoComplete="email"
                    defaultValue={savedEmail.current || undefined}
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Contraseña</Label>
                    <Link href="/forgot-password" className="text-xs font-medium text-sky-600 hover:underline">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <Input
                    id="password" name="password" type="password" required
                    placeholder="••••••••" className="h-11"
                    autoComplete="current-password"
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {/* ── CAPTCHA widget ──────────────────────── */}
                {showCaptcha && (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                      <p className="text-xs font-medium text-indigo-700">
                        Demasiados intentos. Confirmá que sos humano para continuar.
                      </p>
                    </div>
                    <div ref={captchaRef} className="flex justify-center" />
                    {captchaReady && (
                      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                        <ShieldCheck className="h-4 w-4 shrink-0" />
                        Verificación completada — podés intentar de nuevo
                      </div>
                    )}
                  </div>
                )}

                {/* Submit button — if CAPTCHA shown use separate action */}
                {showCaptcha ? (
                  <Button
                    type="button"
                    onClick={handleCaptchaRetry}
                    className="h-11 w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-md"
                    disabled={loading || !captchaReady}
                  >
                    {loading ? "Verificando..." : "Intentar de nuevo"}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="h-11 w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-md"
                    disabled={loading}
                  >
                    {loading ? "Ingresando..." : "Iniciar sesión"}
                  </Button>
                )}
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
