importScripts('version.js');

const CACHE = 'todo-v' + APP_VERSION;
const ASSETS = [
  './', './index.html', './manifest.json', './version.js', './icon.svg', './icon-192.png', './icon-512.png',
  './apple-indigo.png', './apple-ocean.png', './apple-forest.png',
  './apple-sunset.png', './apple-rose.png', './apple-graphite.png',
];
// Скільки чекати мережу для сторінки, перш ніж віддати збережену копію.
const NAV_TIMEOUT = 3000;

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

// Сторінка: спершу мережа (щоб правки в index.html доходили одразу),
// а якщо мережі немає або вона повільна — збережена копія.
function navigate(e) {
  const fromNet = fetch(e.request).then((res) => {
    if (res.ok) {
      const copy = res.clone();
      e.waitUntil(caches.open(CACHE).then((c) => c.put('./index.html', copy)));
    }
    return res;
  });
  const fromCache = () => caches.match('./index.html', { ignoreSearch: true });
  const timeout = new Promise((resolve) => setTimeout(resolve, NAV_TIMEOUT));
  return Promise.race([fromNet.catch(() => null), timeout])
    .then((res) => res || fromCache())
    .then((res) => res || fromNet);
}

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.cache === 'reload' || e.request.cache === 'no-cache') return;
  if (new URL(e.request.url).origin !== location.origin) return;
  if (e.request.mode === 'navigate') {
    e.respondWith(navigate(e));
    return;
  }
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
});
