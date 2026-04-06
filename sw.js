const CACHE_NAME = "growth-v7";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./styles.css",
  "./manifest.json",
  "./child.json",
  "./average_growth.json",
  "./version.json",
  "./jszip.min.js",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(CORE_ASSETS);
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

self.addEventListener("message", (event) => {
  const message = event.data || {};

  if (message.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (message.type === "GET_CURRENT_VERSION") {
    event.waitUntil(
      (async () => {
        let version = "";

        try {
          const cache = await caches.open(CACHE_NAME);
          const response = await cache.match("./version.json");
          if (response) {
            const payload = await response.json();
            version = String(payload?.version || "").trim();
          }
        } catch {
        }

        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ version });
        }
      })()
    );
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isVersionJson = url.pathname.endsWith("/version.json") || url.pathname.endsWith("version.json");

  if (!isSameOrigin) return;

  event.respondWith(
    (async () => {
      if (isVersionJson) {
        try {
          return await fetch(req, { cache: "no-store" });
        } catch {
          const cached = await caches.match(req, { ignoreSearch: true });
          return cached || new Response("", { status: 503, statusText: "Offline fallback" });
        }
      }

      const cached = await caches.match(req, { ignoreSearch: true });
      if (cached) return cached;

      try {
        const networkRes = await fetch(req);
        if (networkRes && networkRes.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, networkRes.clone());
        }
        return networkRes;
      } catch {
        if (req.mode === "navigate") {
          const fallback = await caches.match("./index.html");
          if (fallback) return fallback;
        }
        return new Response("", { status: 503, statusText: "Offline fallback" });
      }
    })()
  );
});
