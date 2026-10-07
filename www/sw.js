const CACHE_NAME = 'trainia-system-v1.2.0';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './styles/main.css',
  './styles/themes.css',
  './js/audio.js',
  './js/timer.js',
  './js/storage.js',
  './js/state.js',
  './js/quests.js',
  './js/loot.js',
  './js/logs.js',
  './js/notifications.js',
  './js/ui.js',
  './js/app.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
