const CACHE_NAME = "growth-v3";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./styles.css",
  "./manifest.json",
  "./child.json",
  "./jszip.min.js",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((res) => {
          if (!res || res.status !== 200) return res;
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => {
          if (req.mode === "navigate") {
            return caches.match("./index.html");
          }

          if (req.url.endsWith("/app.js") || req.url.endsWith("app.js")) {
            return caches.match("./app.js");
          }

          if (req.url.endsWith("/styles.css") || req.url.endsWith("styles.css")) {
            return caches.match("./styles.css");
          }

          if (req.url.endsWith("/manifest.json") || req.url.endsWith("manifest.json")) {
            return caches.match("./manifest.json");
          }

          if (req.url.endsWith("/child.json") || req.url.endsWith("child.json")) {
            return caches.match("./child.json");
          }

          if (req.url.endsWith("/jszip.min.js") || req.url.endsWith("jszip.min.js")) {
            return caches.match("./jszip.min.js");
          }

          if (req.destination === "image") {
            return caches.match("./icon-192.png");
          }

          return new Response("", {
            status: 503,
            statusText: "Offline fallback"
          });
        });
    })
  );
});