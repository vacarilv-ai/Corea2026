// 🌸 Corea 2026 — Service Worker
// Cachea el sitio entero para uso offline.

const CACHE_NAME = 'corea-2026-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  // Google Fonts (best effort — si no carga, no rompe nada)
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400&family=Gowun+Dodum&family=Nanum+Pen+Script&display=swap'
];

// Install: precachea los assets críticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS).catch(() => {})) // tolera fallos individuales
      .then(() => self.skipWaiting())
  );
});

// Activate: limpia caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: stale-while-revalidate
// Devuelve la copia del cache si existe (rápido + offline),
// y en paralelo intenta actualizar desde la red.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request).then(response => {
        // Solo cachea respuestas válidas
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached); // si no hay red, devuelve cache

      return cached || networkFetch;
    })
  );
});
