"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export function PwaInstallPrompt() {
  const [prompt, setPrompt] = useState<any>(null);
  const [show,   setShow]   = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
      // Show after 30 seconds or on 2nd visit
      const shown = localStorage.getItem("pwa-prompt-dismissed");
      if (!shown) setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!show || !prompt) return null;

  async function install() {
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    setShow(false);
    if (outcome === "accepted") localStorage.setItem("pwa-installed", "1");
  }

  function dismiss() {
    setShow(false);
    localStorage.setItem("pwa-prompt-dismissed", "1");
  }

  return (
    <div
      className="fixed bottom-24 left-4 right-4 z-50 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl lg:left-auto lg:right-6 lg:w-80 lg:bottom-6"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600">
        <Download className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Instalar JaneClone</p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Accedé más rápido desde tu pantalla de inicio</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={install}
          className="rounded-xl px-3 py-1.5 text-xs font-bold text-white"
          style={{ backgroundColor: "#2563eb" }}
        >
          Instalar
        </button>
        <button onClick={dismiss} style={{ color: "var(--text-faint)" }}>
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
