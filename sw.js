const CACHE_NAME = 'finory-v5.1';
const ASSETS = ['./', './index.html'];

const MANIFEST = JSON.stringify({
  name: "Finory",
  short_name: "Finory",
  description: "Offline Credit Card Cashback Tracker",
  start_url: "./",
  scope: "./",
  display: "standalone",
  orientation: "portrait",
  background_color: "#000000",
  theme_color: "#000000",
  icons: [
    { src: "./icon.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" },
    { src: "./icon.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any maskable" }
  ]
});

const ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="100" fill="#000000"/><rect x="88" y="88" width="336" height="336" rx="60" fill="none" stroke="#7dd3fc" stroke-width="28"/><text x="256" y="352" font-size="220" font-family="Arial,Helvetica,sans-serif" font-weight="900" fill="#7dd3fc" text-anchor="middle">F</text></svg>';

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) { return cache.addAll(ASSETS); })
      .then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE_NAME; }).map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);
  if (url.pathname.endsWith('/manifest.json')) {
    event.respondWith(new Response(MANIFEST, { headers: { 'Content-Type': 'application/manifest+json' } }));
    return;
  }
  if (url.pathname.endsWith('/icon.svg')) {
    event.respondWith(new Response(ICON_SVG, { headers: { 'Content-Type': 'image/svg+xml' } }));
    return;
  }
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
        }
        return response;
      }).catch(function() { return caches.match('./index.html'); });
    })
  );
});
