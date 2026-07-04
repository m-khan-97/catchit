// Minimal service worker: push notifications only, no offline caching.
// Registered from src/app/account/push-toggle.tsx.

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
