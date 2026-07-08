// JaneClone Service Worker — Push Notifications
const APP_ICON = "/favicon.ico";

self.addEventListener("install",  () => self.skipWaiting());
self.addEventListener("activate", e  => e.waitUntil(clients.claim()));

self.addEventListener("push", event => {
  let data = { title: "JaneClone", body: "Tenés una nueva notificación", url: "/dashboard" };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    APP_ICON,
      badge:   APP_ICON,
      data:    { url: data.url ?? "/dashboard" },
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
      const existing = list.find(c => c.url.includes("/dashboard"));
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});
