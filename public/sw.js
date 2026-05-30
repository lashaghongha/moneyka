// MoneyKa Service Worker — Push Notifications

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = {};
  try { data = event.data.json(); } catch { data = { title: "MoneyKa", body: event.data.text() }; }

  const title   = data.title || "MoneyKa";
  const options = {
    body:    data.body  || "",
    icon:    "/icon-192.png",
    badge:   "/icon-192.png",
    vibrate: [200, 100, 200],
    tag:     data.tag || "moneyka",
    data:    { url: "/" }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((list) => {
      for (const client of list) {
        if (client.url === "/" && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow("/");
    })
  );
});
