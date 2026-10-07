// Comunidade Imerso: só notificações (Web Push). Sem cache e sem fetch: não interfere na Plataforma.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('push', (e) => {
    let d = {};
    try {
        d = e.data ? e.data.json() : {};
    } catch (_) {
        d = {};
    }
    e.waitUntil(
        self.registration.showNotification(d.title || 'Comunidade Imerso', {
            body: d.body || '',
            icon: '/icons/icon-192x192.png',
            tag: 'comunidade',
            renotify: true,
            data: { url: d.url || '/comunidade' },
        }),
    );
});
self.addEventListener('notificationclick', (e) => {
    e.notification.close();
    const url = new URL((e.notification.data && e.notification.data.url) || '/comunidade', self.location.origin).href;
    e.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
            for (const c of list) {
                if (c.url.startsWith(self.location.origin) && 'focus' in c) {
                    return c.focus().then((w) => (w && 'navigate' in w ? w.navigate(url) : w));
                }
            }
            return self.clients.openWindow(url);
        }),
    );
});
