// Minimal service worker for Web Push severe-weather alerts.
// Only the language preference is cached; pages and map data are not cached.

self.addEventListener("message", event => {
  if (event.data?.type === "VTRA_LANGUAGE" && ["vi", "en"].includes(event.data.language)) {
    event.waitUntil(caches.open("vtra-preferences").then(cache => cache.put("/__language", new Response(event.data.language))));
  }
});

self.addEventListener("push", (event) => {
  let payload = { title: "Cảnh báo thời tiết", body: "Có cập nhật mới." };
  try {
    if (event.data) payload = event.data.json();
  } catch {
    // ignore malformed payload, use default
  }

  event.waitUntil(
    (async () => {
      const preference = await (await caches.open("vtra-preferences")).match("/__language");
      const english = preference && await preference.text() === "en";
      return self.registration.showNotification(english ? payload.title_en || "Weather alert" : payload.title, {
        body: english ? payload.body_en || "Check the latest weather at your destination." : payload.body,
      });
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/");
    })
  );
});
