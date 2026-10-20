// Frasa Klausa Media - Service Worker (PWA)
const CACHE_VERSION = 'fkm-pwa-v1';
const OFFLINE_URL = '/offline';

const PRECACHE_ASSETS = [
  OFFLINE_URL,
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_VERSION) {
              return caches.delete(cacheName);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Hanya tangani metode GET
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Jangan tangani permintaan lintas domain (Supabase, Google Maps, dll.)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Bypass rute internal yang dinamis, sensitif, atau API
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/_next/data/')
  ) {
    return;
  }

  // 1. Strategi untuk Navigasi Halaman HTML: Network-First dengan Fallback ke /offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Jika respons sukses dan valid, simpan salinan untuk navigasi offline
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Jika offline, coba ambil dari cache halaman tersebut
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Jika belum pernah dikunjungi, tampilkan halaman offline cadangan
          const offlineFallback = await caches.match(OFFLINE_URL);
          if (offlineFallback) {
            return offlineFallback;
          }
          return new Response('Anda sedang offline.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        })
    );
    return;
  }

  // 2. Strategi untuk Aset Statis (_next/static, /icons, /logo, font, gambar): Stale-While-Revalidate
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/logo/') ||
    /\.(?:png|jpg|jpeg|svg|webp|ico|woff2|woff|ttf)$/.test(url.pathname);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_VERSION).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});
