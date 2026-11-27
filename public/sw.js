self.addEventListener('push', function (event) {
  let payload = {
    title: '☕ Chai Pe Charcha',
    body: 'Chai time ho gaya hai!',
    url: '/',
    icon: '/icon.png',
    badge: '/icon.png',
  };

  if (event.data) {
    try {
      const data = event.data.json();
      payload = { ...payload, ...data };
    } catch {
      payload.body = event.data.text() || payload.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/icon.png',
      badge: payload.badge || '/icon.png',
      data: { url: payload.url || '/' },
      vibrate: [200, 100, 200],
      tag: payload.tag || 'bhabhikichai-reminder',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
