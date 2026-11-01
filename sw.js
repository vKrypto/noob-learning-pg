// Remind Myself service worker: offline support + notification clicks.
// Bump CACHE when you release a new version (keep in sync with VERSION in js/pwa.js).
const CACHE = 'remind-myself-v1.4.0';
const ASSETS = [
  './', './index.html', './manifest.webmanifest', './css/app.css',
  './js/app.js', './js/util.js', './js/store.js', './js/i18n.js', './js/ui.js', './js/sound.js', './js/quotes.js',
  './js/voice.js', './js/reminders.js', './js/ics.js', './js/pwa.js', './js/db.js',
  './js/sync.js', './js/cloud.js', './js/firebase-config.js',
  './js/views/home.js', './js/views/tasks.js', './js/views/taskForm.js', './js/views/calendar.js',
  './js/views/reports.js', './js/views/profile.js', './js/views/birthdays.js', './js/views/menu.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });

// Network first for the app files (so updates arrive fast), cache as fallback when offline.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(e.request);
      if (res.ok) (await caches.open(CACHE)).put(e.request, res.clone());
      return res;
    } catch {
      return (await caches.match(e.request, { ignoreSearch: true })) || caches.match('./index.html');
    }
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (all.length) { all[0].focus(); all[0].postMessage({ type: 'open', hash: '#/home' }); return; }
    return self.clients.openWindow('./#/home');
  })());
});
