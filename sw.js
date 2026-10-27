importScripts('version.js');

const CACHE = 'todo-v' + APP_VERSION;
const ASSETS = [
  './', './index.html', './manifest.json', './version.js', './icon.svg', './icon-192.png', './icon-512.png',
  './apple-indigo.png', './apple-ocean.png', './apple-forest.png',
  './apple-sunset.png', './apple-rose.png', './apple-graphite.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.cache === 'reload' || e.request.cache === 'no-cache') return;
  e.respondWith(
    caches.match(e.request).then((hit) =>
      hit || fetch(e.request).catch(() => caches.match('./index.html'))
    )
  );
});
