/**
 * Mini Game Arcade - Service Worker
 * Stale-while-revalidate caching strategy for offline support and rapid reloads.
 */

const CACHE_NAME = 'mini-game-arcade-v1';
const CORE_ASSETS = [
  '/',
  '/css/arcade.css',
  '/js/games-data.js',
  '/js/arcade.js',
  '/manifest.json',
  '/assets/icons/icon.svg',
  '/assets/icons/icon-192.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Ignore chrome extensions or non-http
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(
    caches.match(req).then((cachedResp) => {
      const fetchPromise = fetch(req).then((networkResp) => {
        if (networkResp && networkResp.status === 200 && networkResp.type === 'basic') {
          const respClone = networkResp.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, respClone);
          });
        }
        return networkResp;
      }).catch(() => cachedResp);

      return cachedResp || fetchPromise;
    })
  );
});
