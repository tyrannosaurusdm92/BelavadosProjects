const CACHE_NAME = 'belavados-effect-studio-v2026-06-22-lightning-js-restored';
const CORE_ASSETS = [
  './',
  './index.html',
  './mobile.html',
  './desktop.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/app.js',
  './js/backend.js',
  './js/vendor/lax.min.js',
  './js/vendor/Pizzicato.min.js',
  './js/vendor/slidr.min.js',
  './icons/icon.svg',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      return response;
    }).catch(() => caches.match('./index.html')))
  );
});
