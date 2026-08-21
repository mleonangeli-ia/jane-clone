"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ShieldCheck, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { computeScore, levelFromScore, typeFromLevel, getScoreLabel, getScoreColor, type RiskLevel, type CaptchaType } from "@/lib/captcha-scoring";

// ── Constants ─────────────────────────────────────────────────────────────────
const BG_W = 320, BG_H = 120, PW = 52, PH = 72, PY = Math.round((BG_H - PH) / 2);
const SLIDER_MAX = BG_W - PW;

type WidgetState = "loading" | "idle" | "checking" | "ok" | "error";

interface CaptchaSession { level: RiskLevel; type: CaptchaType; token: string; }
interface SubProps { token: string; onVerified: (proof: string) => void; onError: (msg: string) => void; }

// ── MathWidget ────────────────────────────────────────────────────────────────
function MathWidget({ token, onVerified, onError }: SubProps) {
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "wrong">("idle");
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const verify = useCallback(async (val: string) => {
    const n = parseInt(val, 10);
    if (isNaN(n)) return;
    setStatus("checking");
    try {
      const r = await fetch("/api/captcha/math/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, answer: n }),
      });
      const d = await r.json() as { ok: boolean; proof?: string };
      if (d.ok && d.proof) { setStatus("ok"); onVerified(d.proof); }
      else setStatus("wrong");
    } catch { onError("Error de conexión"); }
  }, [token, onVerified, onError]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAnswer(val);
    if (status !== "idle") setStatus("idle");
    clearTimeout(debounce.current);
    if (val) debounce.current = setTimeout(() => verify(val), 500);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-center">
        <img
          src={`/api/captcha/math/image?token=${encodeURIComponent(token)}`}
          alt="Operación matemática"
          className="rounded-xl border border-gray-100 shadow-sm"
          style={{ imageRendering: "pixelated" }}
        />
      </div>
      <div className="relative">
        <input
          type="number" value={answer} onChange={handleInput} placeholder="Resultado"
          min={0} max={999} autoFocus
          className={`w-full h-12 px-4 rounded-xl border-2 text-xl font-bold text-center
            text-gray-900 placeholder:text-gray-300 focus:outline-none transition-all
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
            ${status === "ok" ? "border-emerald-400 bg-emerald-50"
            : status === "wrong" ? "border-red-300 bg-red-50"
            : "border-gray-200 bg-white focus:border-teal-400"}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {status === "checking" && <div className="w-4 h-4 border-2 border-gray-300 border-t-teal-500 rounded-full animate-spin" />}
          {status === "ok" && <CheckCircle2 size={18} className="text-emerald-500" />}
          {status === "wrong" && <AlertCircle size={18} className="text-red-400" />}
        </div>
      </div>
      {status === "wrong" && <p className="text-center text-xs text-red-500">Resultado incorrecto, intentá de nuevo</p>}
    </div>
  );
}

// ── PuzzleWidget ──────────────────────────────────────────────────────────────
function PuzzleWidget({ token, onVerified, onError }: SubProps) {
  const [sliderPx, setSliderPx] = useState(0);
  const [solved, setSolved] = useState(false);
  const [checking, setChecking] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const verify = useCallback(async (px: number) => {
    const userX = Math.round((px / SLIDER_MAX) * 100);
    setChecking(true);
    try {
      const r = await fetch("/api/captcha/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, px: userX }),
      });
      const d = await r.json() as { ok: boolean; proof?: string };
      if (d.ok && d.proof) { setSolved(true); onVerified(d.proof); }
    } catch { onError("Error de conexión"); }
    finally { setChecking(false); }
  }, [token, onVerified, onError]);

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const px = Number(e.target.value);
    setSliderPx(px);
    if (solved) setSolved(false);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => verify(px), 250);
  };

  return (
    <div className="space-y-3">
      <div className={`relative rounded-xl overflow-hidden border transition-all ${solved ? "border-emerald-300 shadow-emerald-100 shadow-md" : "border-gray-200 shadow-sm"}`}
        style={{ width: BG_W, height: BG_H, maxWidth: "100%" }}>
        <img src={`/api/captcha/bg?token=${encodeURIComponent(token)}`} width={BG_W} height={BG_H}
          alt="" draggable={false} className="block select-none" />
        <img src={`/api/captcha/piece?token=${encodeURIComponent(token)}`} width={PW} height={PH}
          alt="" draggable={false} className="absolute select-none"
          style={{
            top: PY, left: sliderPx, borderRadius: 5, boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            outline: solved ? "2.5px solid #22c55e" : "2px solid rgba(255,255,255,0.5)",
          }} />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-base w-5 text-center select-none">{solved ? "✅" : checking ? "⏳" : "▶"}</span>
        <input type="range" min={0} max={SLIDER_MAX} value={sliderPx} onChange={handleSlider}
          aria-label="Arrastrá la pieza" className="flex-1 h-1.5 cursor-pointer accent-teal-500" />
      </div>
    </div>
  );
}

// ── TextWidget ────────────────────────────────────────────────────────────────
function TextWidget({ token, onVerified, onError }: SubProps) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "wrong">("idle");

  const verify = useCallback(async (val: string) => {
    if (val.length < 5) return;
    setStatus("checking");
    try {
      const r = await fetch("/api/captcha/text/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, code: val }),
      });
      const d = await r.json() as { ok: boolean; proof?: string };
      if (d.ok && d.proof) { setStatus("ok"); onVerified(d.proof); }
      else setStatus("wrong");
    } catch { onError("Error de conexión"); }
  }, [token, onVerified, onError]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().slice(0, 5);
    setCode(val);
    if (status !== "idle") setStatus("idle");
    if (val.length === 5) verify(val);
  };

  return (
    <div className="space-y-3">
      <img src={`/api/captcha/text/image?token=${encodeURIComponent(token)}`}
        alt="Texto distorsionado" className="w-full rounded-xl border border-gray-100 shadow-sm"
        style={{ imageRendering: "pixelated" }} />
      <p className="text-center text-xs text-gray-400">Escribí los 5 caracteres (no distingue mayúsculas)</p>
      <div className="relative">
        <input type="text" value={code} onChange={handleInput} maxLength={5} autoComplete="off" autoFocus
          placeholder="_ _ _ _ _"
          className={`w-full h-12 px-4 rounded-xl border-2 text-lg font-mono font-bold text-center
            tracking-[.5em] uppercase text-gray-900 placeholder:text-gray-300 focus:outline-none transition-all
            ${status === "ok" ? "border-emerald-400 bg-emerald-50"
            : status === "wrong" ? "border-red-300 bg-red-50"
            : "border-gray-200 bg-white focus:border-teal-400"}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {status === "checking" && <div className="w-4 h-4 border-2 border-gray-300 border-t-teal-500 rounded-full animate-spin" />}
          {status === "ok" && <CheckCircle2 size={18} className="text-emerald-500" />}
          {status === "wrong" && <AlertCircle size={18} className="text-red-400" />}
        </div>
      </div>
      {status === "wrong" && <p className="text-center text-xs text-red-500">Código incorrecto, revisá bien los caracteres</p>}
    </div>
  );
}

// ── Main CaptchaWidget ────────────────────────────────────────────────────────
interface Props {
  onVerified: (proof: string) => void;
  onReset?: () => void;
}

export default function CaptchaWidget({ onVerified, onReset }: Props) {
  const mouseCount = useRef(0);
  const keyCount = useRef(0);
  const startTime = useRef(Date.now());
  const [session, setSession] = useState<CaptchaSession | null>(null);
  const [widgState, setWidgState] = useState<WidgetState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [level, setLevel] = useState<RiskLevel>("easy");

  // Score immediately on mount — NO delay, NO HTTP
  useEffect(() => {
    const signals = {
      webdriver: Boolean((navigator as { webdriver?: boolean }).webdriver),
      mouseEvents: mouseCount.current,
      keyEvents: keyCount.current,
      timeOnPage: Date.now() - startTime.current,
      isMobile: "ontouchstart" in window,
      screenW: screen.width ?? 0,
      screenH: screen.height ?? 0,
      plugins: navigator.plugins?.length ?? 0,
      cookiesEnabled: navigator.cookieEnabled ?? true,
      hardwareConcurrency: navigator.hardwareConcurrency ?? 0,
      languages: navigator.languages?.length ?? 0,
    };

    const score = computeScore(signals, navigator.userAgent);
    const riskLevel = levelFromScore(score);
    const captchaType = typeFromLevel(riskLevel);

    setLevel(riskLevel);

    // Fetch token in parallel — don't block rendering
    const controller = new AbortController();
    fetch("/api/captcha/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signals),
      signal: controller.signal,
    })
      .then((r) => r.json() as Promise<{ token: string; level: RiskLevel; type: CaptchaType }>)
      .then((data) => {
        setSession(data);
        setWidgState("idle");
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setWidgState("error");
          setErrorMsg("Error al cargar la verificación");
        }
      });

    // Track mouse/key events
    const onMouse = () => mouseCount.current++;
    const onKey = () => keyCount.current++;
    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("keydown", onKey, { passive: true });

    return () => {
      controller.abort();
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const handleVerified = useCallback((proof: string) => {
    setWidgState("ok");
    onVerified(proof);
  }, [onVerified]);

  const handleError = useCallback((msg: string) => {
    setWidgState("error");
    setErrorMsg(msg);
  }, []);

  const handleRetry = () => {
    onReset?.();
    mouseCount.current = 0;
    keyCount.current = 0;
    startTime.current = Date.now();
    setSession(null);
    setWidgState("loading");
    setErrorMsg("");
    // Re-trigger scoring
    window.location.reload();
  };

  const scoreColor = getScoreColor(level);
  const scoreLabel = getScoreLabel(level);

  return (
    <div className="rounded-xl border bg-white shadow-sm p-4 space-y-3 border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className={scoreColor} />
          <span className={`text-xs font-semibold ${scoreColor}`}>
            {session ? scoreLabel : "Verificación de seguridad"}
          </span>
        </div>
        {widgState !== "loading" && widgState !== "ok" && (
          <button type="button" onClick={handleRetry}
            className="text-gray-300 hover:text-gray-500 transition-colors">
            <RefreshCw size={12} />
          </button>
        )}
      </div>

      {/* Loading state — no blocking spinner, widget is ready immediately */}
      {widgState === "loading" && (
        <div className="flex items-center justify-center py-2 gap-2">
          <div className="w-3 h-3 border border-gray-200 border-t-teal-500 rounded-full animate-spin" />
          <span className="text-xs text-gray-400">Cargando...</span>
        </div>
      )}

      {/* Error state */}
      {widgState === "error" && (
        <div className="flex flex-col items-center gap-2 py-3 text-center">
          <p className="flex items-center gap-1.5 text-xs text-red-500">
            <AlertCircle size={11} /> {errorMsg}
          </p>
          <button type="button" onClick={handleRetry} className="text-xs text-teal-600 hover:underline">
            Reintentar
          </button>
        </div>
      )}

      {/* CAPTCHA widgets render immediately even while loading token */}
      {widgState !== "error" && session && (
        <>
          {session.type === "math" && <MathWidget token={session.token} onVerified={handleVerified} onError={handleError} />}
          {session.type === "puzzle" && <PuzzleWidget token={session.token} onVerified={handleVerified} onError={handleError} />}
          {session.type === "text" && <TextWidget token={session.token} onVerified={handleVerified} onError={handleError} />}
        </>
      )}
    </div>
  );
}
