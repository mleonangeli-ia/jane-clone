// JaneClone Service Worker v2 — Push + Cache
const CACHE   = "janeclone-v1";
const APP_ICON = "/icon-192.svg";

// Assets to cache on install
const PRECACHE = [
  "/dashboard",
  "/dashboard/appointments",
  "/icon-192.svg",
  "/favicon.ico",
];

// ── Install: pre-cache shell ──────────────────────────────
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).catch(() => {})
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ───────────────────────────
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

// ── Fetch: network-first for API, cache-first for assets ─
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Skip non-GET and API calls
  if (event.request.method !== "GET") return;
  if (url.pathname.startsWith("/api/")) return;

  // Network-first for HTML pages
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request).then(r => r ?? caches.match("/dashboard")))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(event.request, clone));
        }
        return res;
      });
    })
  );
});

// ── Push notifications ───────────────────────────────────
self.addEventListener("push", event => {
  let data = { title: "JaneClone", body: "Tenés una nueva notificación", url: "/dashboard" };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    APP_ICON,
      badge:   APP_ICON,
      data:    { url: data.url },
      vibrate: [100, 50, 100],
      actions: [{ action: "open", title: "Ver →" }],
    })
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      const w = list.find(c => c.url.includes("/dashboard"));
      if (w) return w.focus();
      return clients.openWindow(url);
    })
  );
});
