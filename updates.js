const CACHE_NAME = 'pato-survival-v0.0.8';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './img/idle1.png',
  './img/idle2.png',
  './img/walk1.png',
  './img/walk2.png',
  './img/arvore.png',
  './img/rocha.png',
  './img/icongame.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

