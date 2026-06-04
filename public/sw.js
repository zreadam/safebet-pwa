// SafeBet Service Worker

self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', function(event) {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: data.icon || '/logo.png',
    badge: '/logo.png',
    data: data.data || {},
    vibrate: [200, 100, 200],
    actions: data.data && data.data.matchUrl ? [
      { action: 'open', title: 'Voir le match' }
    ] : []
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.action === 'open' || event.notification.data && event.notification.data.matchUrl) {
    var url = (event.notification.data && event.notification.data.matchUrl) || '/dashboard';
    event.waitUntil(clients.openWindow(url));
  }
});
