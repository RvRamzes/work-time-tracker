const CACHE_NAME = 'time-tracker-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico'
];

// Встановлення та кешування основних файлів
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Активація та очищення старого кешу
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Перехоплення запитів: спочатку шукаємо в кеші, якщо немає — в мережі
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
