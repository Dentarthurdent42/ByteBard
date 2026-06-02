const CACHE = 'biosignal-v1';

const STATIC = [
  '/',
  '/index.html',
  '/css/main.css',
  '/src/main.js',
  '/src/bus.js',
  '/src/math.js',
  '/src/engine.js',
  '/src/mapper.js',
  '/src/cv.js',
  '/src/ui/status.js',
  '/src/ui/signals.js',
  '/src/ui/mapper-ui.js',
  '/src/ui/audio-ui.js',
  '/src/ui/viz.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/manifest.json',
];

// Pre-cache all local static assets on install
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC))
      .then(() => self.skipWaiting())
  );
});

// Remove stale caches on activation
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache-first for local assets; network-only for CDN (MediaPipe models, fonts)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Pass CDN requests straight through — they're large model files we don't cache
  if (url.origin !== self.location.origin) {
    e.respondWith(fetch(e.request));
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Only cache successful same-origin GET responses
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
