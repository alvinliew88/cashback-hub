const CACHE_NAME = 'finory-v8.0';
const ASSETS = ['./', './index.html'];

const MANIFEST = JSON.stringify({
  name: "Finory", short_name: "Finory",
  description: "Offline Credit Card Cashback Tracker",
  start_url: "./", scope: "./",
  display: "standalone", orientation: "portrait",
  background_color: "#000000", theme_color: "#000000",
  icons: [
    { src: "./icon.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" },
    { src: "./icon.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any maskable" }
  ]
});

const ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><radialGradient id="g" cx="30%" cy="30%" r="80%"><stop offset="0%" stop-color="#7dd3fc"/><stop offset="100%" stop-color="#1e3a8a"/></radialGradient></defs><rect width="512" height="512" rx="110" fill="url(#g)"/><rect x="0" y="0" width="512" height="512" rx="110" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="6"/><text x="256" y="360" font-size="240" font-family="Arial,Helvetica,sans-serif" font-weight="900" fill="#fff" text-anchor="middle">F</text></svg>';

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) { return cache.addAll(ASSETS).catch(function() {}); })
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
    fetch(event.request).then(function(response) {
      if (response && response.status === 200 && response.type === 'basic') {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
      }
      return response;
    }).catch(function() {
      return caches.match(event.request).then(function(cached) {
        return cached || caches.match('./index.html');
      });
    })
  );
});
