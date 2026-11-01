// Service worker: keeps a copy of the app's files so Flashcard Coach opens offline.
// Change CACHE when you publish a new version so phones fetch the new files.
const CACHE = 'flashcard-coach-v1';
const FILES = ['./', './index.html', './style.css', './app.js', './db.js', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('flashcard-coach-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Try the network first (so updates show up), fall back to the saved copy when offline.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
});
