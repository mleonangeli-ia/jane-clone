"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ShieldCheck, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { useCaptchaToken } from "@/lib/useCaptchaToken";
import { getScoreLabel, getScoreColor } from "@/lib/captcha-scoring";

const BG_W = 320, BG_H = 120, PW = 52, PH = 72, PY = Math.round((BG_H - PH) / 2);
const SLIDER_MAX = BG_W - PW;

type WidgetState = "idle" | "checking" | "ok" | "error";

interface SubProps { token: string; onVerified: (proof: string) => void; onError: (msg: string) => void; }

// ── MathWidget ────────────────────────────────────────────────────────────────
function MathWidget({ token, onVerified, onError }: SubProps) {
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "wrong">("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
      <img src={`/api/captcha/math/image?token=${encodeURIComponent(token)}`}
        alt="Operación matemática" className="rounded-xl border border-gray-100 shadow-sm w-full"
        style={{ imageRendering: "pixelated" }} />
      <div className="relative">
        <input ref={inputRef} type="number" value={answer} onChange={handleInput}
          placeholder="Resultado" min={0} max={999}
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
  const debounce = useRef<ReturnType<typeof setTimeout>>();

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
          alt="" draggable={false} className="block" />
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
          className="flex-1 h-1.5 cursor-pointer accent-teal-500" />
      </div>
    </div>
  );
}

// ── TextWidget ────────────────────────────────────────────────────────────────
function TextWidget({ token, onVerified, onError }: SubProps) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "wrong">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
      <p className="text-center text-xs text-gray-400">Escribí los 5 caracteres</p>
      <div className="relative">
        <input ref={inputRef} type="text" value={code} onChange={handleInput} maxLength={5} autoComplete="off"
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
      {status === "wrong" && <p className="text-center text-xs text-red-500">Código incorrecto, revisá bien</p>}
    </div>
  );
}

// ── Main CaptchaWidget ────────────────────────────────────────────────────────
interface Props {
  onVerified: (proof: string) => void;
  onReset?: () => void;
}

export default function CaptchaWidget({ onVerified, onReset }: Props) {
  const { token, level, type, loading, error } = useCaptchaToken();
  const [widgState, setWidgState] = useState<WidgetState>("idle");

  const handleVerified = useCallback((proof: string) => {
    setWidgState("ok");
    onVerified(proof);
  }, [onVerified]);

  const handleError = useCallback((msg: string) => {
    setWidgState("error");
  }, []);

  const handleRetry = () => {
    onReset?.();
    setWidgState("idle");
  };

  return (
    <div className="rounded-xl border bg-white shadow-sm p-4 space-y-3 border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className={getScoreColor(level)} />
          <span className={`text-xs font-semibold ${getScoreColor(level)}`}>
            {getScoreLabel(level)}
          </span>
        </div>
        {widgState !== "ok" && (
          <button type="button" onClick={handleRetry}
            className="text-gray-300 hover:text-gray-500 transition-colors" title="Reintentar">
            <RefreshCw size={12} />
          </button>
        )}
      </div>

      {/* Loading (minimal — should be <50ms) */}
      {loading && (
        <div className="flex items-center justify-center py-2 gap-2">
          <div className="w-3 h-3 border border-gray-200 border-t-teal-500 rounded-full animate-spin" />
          <span className="text-xs text-gray-400">Cargando...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex flex-col items-center gap-2 py-3 text-center">
          <p className="text-xs text-red-500 flex items-center gap-1.5">
            <AlertCircle size={11} /> Error: {error}
          </p>
          <button onClick={handleRetry} className="text-xs text-teal-600 hover:underline">
            Reintentar
          </button>
        </div>
      )}

      {/* CAPTCHA widgets */}
      {token && !error && (
        <>
          {type === "math" && <MathWidget token={token} onVerified={handleVerified} onError={handleError} />}
          {type === "puzzle" && <PuzzleWidget token={token} onVerified={handleVerified} onError={handleError} />}
          {type === "text" && <TextWidget token={token} onVerified={handleVerified} onError={handleError} />}
        </>
      )}
    </div>
  );
}
