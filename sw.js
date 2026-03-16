const CACHE_NAME = "growth-v5";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./styles.css",
  "./manifest.json",
  "./child.json",
  "./average_growth.json",
  "./jszip.min.js",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(CORE_ASSETS);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  event.respondWith(
    (async () => {
      try {
        const networkRes = await fetch(req);

        if (url.origin === location.origin && networkRes && networkRes.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, networkRes.clone());
        }

        return networkRes;
      } catch (error) {
        const cached = await caches.match(req);
        if (cached) return cached;

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
        if (req.url.endsWith("/average_growth.json") || req.url.endsWith("average_growth.json")) {
          return caches.match("./average_growth.json");
        }
        if (req.url.endsWith("/jszip.min.js") || req.url.endsWith("jszip.min.js")) {
          return caches.match("./jszip.min.js");
        }
        if (req.destination === "image") {
          return caches.match("./icon-192.png");
        }

        return new Response("", { status: 503, statusText: "Offline fallback" });
      }
    })()
  );
});