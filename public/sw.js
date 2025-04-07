const CACHE_NAME = "cosmic-notes-v1";
const urlsToCache = [
  "/",
  "/note",
  "/search",
  "/chat",
  "/cluster",
  "/offline.html",
  "/icon-template.svg",
  "/browserconfig.xml",
  "/src/app/favicon.ico",
  "/globe.svg",
  "/window.svg",
  "/file.svg",
];

// Install the service worker and cache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate the service worker and clean up old caches
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Serve cached content when offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        // Cache hit - return the response from the cached version
        if (response) {
          return response;
        }

        // Not in cache - fetch from network
        return fetch(event.request).then((networkResponse) => {
          // Check if we received a valid response
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== "basic"
          ) {
            return networkResponse;
          }

          // Clone the response
          const responseToCache = networkResponse.clone();

          // Add the response to the cache
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        });
      })
      .catch(() => {
        // If both cache and network fail, show the offline page for HTML requests
        if (
          event.request.url.match(/\.(html|htm)$/) ||
          event.request.mode === "navigate"
        ) {
          return caches.match("/offline.html");
        }
      })
  );
});
