/* Belavadös lightweight service worker for app-icon install shell.
   Network-first for HTML/JSON so backend-connected data stays fresh;
   cache-first fallback for local static assets. */
const CACHE_NAME = 'belavados-character-studio-v1';
const LOCAL_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/belavados-backend-responsive.css',
  './js/belavados-backend-bridge.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(LOCAL_ASSETS)).catch(() => null));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if(request.method !== 'GET') return;
  const url = new URL(request.url);
  if(url.hostname.includes('script.google.com')) return;
  if(request.mode === 'navigate' || /\.(html|json|webmanifest)$/i.test(url.pathname)){
    event.respondWith(fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => null);
      return response;
    }).catch(() => caches.match(request).then(hit => hit || caches.match('./index.html'))));
    return;
  }
  event.respondWith(caches.match(request).then(hit => hit || fetch(request).then(response => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => null);
    return response;
  }).catch(() => hit)));
});
