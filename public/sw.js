// Service worker: push notifications + a minimal offline fallback.
// Registered from src/app/account/push-toggle.tsx.

const OFFLINE_CACHE = "catchit-offline-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE).then((cache) => cache.add(OFFLINE_URL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Network-first for page navigations; fall back to the cached offline page
// only when the network truly fails. Everything else (assets, API calls)
// passes straight through — this isn't a full offline app, just a graceful
// "you're offline" screen instead of the browser's default error page.
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL))
  );
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "CatchIt", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "CatchIt";
  const options = {
    body: data.body || "",
    icon: "/pwa-icon-192",
    badge: "/pwa-icon-192",
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
