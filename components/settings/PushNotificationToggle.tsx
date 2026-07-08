"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2, CheckCircle, AlertCircle } from "lucide-react";

type State = "idle" | "loading" | "subscribed" | "blocked" | "unsupported";

export function PushNotificationToggle() {
  const [state,  setState]  = useState<State>("loading");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }

    checkSubscription();
  }, []);

  async function checkSubscription() {
    setState("loading");
    const perm = Notification.permission;
    if (perm === "denied") { setState("blocked"); return; }

    const reg = await navigator.serviceWorker.register("/sw.js");
    const sub = await reg.pushManager.getSubscription();
    setState(sub ? "subscribed" : "idle");
  }

  async function subscribe() {
    setState("loading");
    try {
      // Register SW
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Get VAPID public key
      const keyRes = await fetch("/api/push/vapid-key");
      const { publicKey } = await keyRes.json();

      // Request permission + subscribe
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Save to server
      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });

      setState("subscribed");
    } catch (err: any) {
      if (Notification.permission === "denied") {
        setState("blocked");
      } else {
        setState("idle");
        console.error("[push] subscribe error:", err);
      }
    }
  }

  async function unsubscribe() {
    setState("loading");
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await reg?.pushManager.getSubscription();

    if (sub) {
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
    }

    setState("idle");
  }

  async function sendTest() {
    setTesting(true);
    await fetch("/api/push/test", { method: "POST" });
    setTesting(false);
  }

  if (state === "unsupported") {
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
        <BellOff className="h-4 w-4" />
        Tu navegador no soporta notificaciones push
      </div>
    );
  }

  if (state === "blocked") {
    return (
      <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          Las notificaciones están bloqueadas. Habilitálas en la configuración de tu navegador.
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        {state === "subscribed"
          ? <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
              <Bell className="h-4 w-4 text-blue-600" />
            </div>
          : <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: "var(--bg-subtle)" }}>
              <BellOff className="h-4 w-4" style={{ color: "var(--text-faint)" }} />
            </div>
        }
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            {state === "subscribed" ? "Notificaciones activas" : "Notificaciones desactivadas"}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {state === "subscribed"
              ? "Recibirás alertas de nuevos turnos en este dispositivo"
              : "Activálas para recibir alertas de nuevos turnos"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {state === "subscribed" && (
          <button
            onClick={sendTest}
            disabled={testing}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
            Probar
          </button>
        )}

        {state === "loading" ? (
          <div className="flex h-9 w-9 items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--text-faint)" }} />
          </div>
        ) : state === "subscribed" ? (
          <button
            onClick={unsubscribe}
            className="rounded-xl px-4 py-2 text-sm font-medium text-red-500 transition-all hover:bg-red-50"
          >
            Desactivar
          </button>
        ) : (
          <button
            onClick={subscribe}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: "#2563eb" }}
          >
            Activar notificaciones
          </button>
        )}
      </div>
    </div>
  );
}

// Helper: convert base64url to Uint8Array for applicationServerKey
function urlBase64ToUint8Array(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}
