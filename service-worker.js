
const CACHE_NAME = "cham-cong-v1";
const BASE_URL = new URL("./", self.location.href);

const FILES_TO_CACHE = [
  BASE_URL.href,
  new URL("index.html", BASE_URL).href,
  new URL("manifest.json", BASE_URL).href
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(async () => {
          return (await caches.match(event.request))
            || (await caches.match(BASE_URL.href))
            || (await caches.match(
              new URL("index.html", BASE_URL).href
            ));
        })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;

        return fetch(event.request).then(response => {
          if (response.ok &&
              new URL(event.request.url).origin === self.location.origin) {
            const copy = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, copy));
          }
          return response;
        });
      })
    );
  }
});
