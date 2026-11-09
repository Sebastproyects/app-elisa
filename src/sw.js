// Service worker: guarda la app para abrir rápido/sin internet y muestra los avisos push.
const CACHE = 'secretos-elisa-v4';
const BUILD = '__BUILD__'; // cambia en cada publicación: así el celular detecta la versión nueva
const SHELL = ['./', 'index.html', 'app.js', 'style.css', 'manifest.webmanifest', 'icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Primero la red (para que las actualizaciones lleguen enseguida); si no hay internet, lo guardado.
self.addEventListener('fetch', (e) => {
  const r = e.request; const u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/__/')) return;
  e.respondWith(fetch(r).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(r, copy)); }
    return res;
  }).catch(() => caches.match(r).then((m) => m || caches.match('index.html'))));
});

self.addEventListener('push', (e) => {
  let d = {};
  try {
    const j = e.data ? e.data.json() : {};
    d = Object.assign({}, j.notification || {}, j.data || {});
  } catch (_) { d = { body: e.data ? e.data.text() : '' }; }
  const urgent = d.urgent === '1' || d.urgent === 1;
  // Si la app está abierta pero en segundo plano, le pedimos que haga sonar la voz “secretos”.
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) =>
    cs.filter((c) => c.visibilityState !== 'visible').forEach((c) => c.postMessage({ type: 'push-sound' }))));
  e.waitUntil(self.registration.showNotification(d.title || 'Los Secretos de Elisa', {
    body: d.body || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: d.tag || undefined,
    renotify: !!d.tag,
    requireInteraction: urgent,
    vibrate: urgent ? [300, 150, 300, 150, 300] : [150],
    data: { url: d.url || './' },
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
    for (const c of cs) { if ('focus' in c) return c.focus(); }
    return self.clients.openWindow(e.notification.data.url || './');
  }));
});
