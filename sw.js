const APP_VERSION = "1.1.0";
const CACHE_NAME = `growth-cache-${APP_VERSION}`;
const META_CACHE_NAME = "growth-meta";
const ACTIVE_CACHE_KEY = "./__active_cache_name__";
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

function normalizePathname(url) {
  const pathname = new URL(url, self.location.origin).pathname;
  return pathname.replace(/\/$/, "") || "/";
}

function isLatestVersionRequest(url) {
  return normalizePathname(url.href).endsWith("/version.json") && url.searchParams.get("mode") === "latest";
}

function getCoreCacheKey(requestUrl) {
  const pathname = normalizePathname(requestUrl.href);

  if (pathname === "/" || pathname.endsWith("/index.html")) return "./index.html";
  if (pathname.endsWith("/app.js")) return "./app.js";
  if (pathname.endsWith("/styles.css")) return "./styles.css";
  if (pathname.endsWith("/manifest.json")) return "./manifest.json";
  if (pathname.endsWith("/child.json")) return "./child.json";
  if (pathname.endsWith("/average_growth.json")) return "./average_growth.json";
  if (pathname.endsWith("/version.json")) return "./version.json";
  if (pathname.endsWith("/jszip.min.js")) return "./jszip.min.js";
  if (pathname.endsWith("/icon-192.png")) return "./icon-192.png";
  if (pathname.endsWith("/icon-512.png")) return "./icon-512.png";

  return null;
}

async function readActiveCacheName() {
  try {
    const metaCache = await caches.open(META_CACHE_NAME);
    const response = await metaCache.match(ACTIVE_CACHE_KEY);
    if (!response) return "";
    return String(await response.text()).trim();
  } catch {
    return "";
  }
}

async function writeActiveCacheName(cacheName) {
  const metaCache = await caches.open(META_CACHE_NAME);
  await metaCache.put(ACTIVE_CACHE_KEY, new Response(String(cacheName || ""), {
    headers: { "content-type": "text/plain;charset=utf-8" }
  }));
}

async function getServingCacheName() {
  return (await readActiveCacheName()) || CACHE_NAME;
}

async function cacheCoreAssets(targetCacheName = CACHE_NAME) {
  const cache = await caches.open(targetCacheName);
  await cache.addAll(CORE_ASSETS);
}

async function getCachedCurrentVersion() {
  try {
    const cache = await caches.open(await getServingCacheName());
    const response = await cache.match("./version.json");
    if (!response) return "";
    const payload = await response.json();
    return String(payload?.version || "").trim();
  } catch {
    return "";
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      await cacheCoreAssets(CACHE_NAME);
      const activeCacheName = await readActiveCacheName();
      if (!activeCacheName) {
        await writeActiveCacheName(CACHE_NAME);
      }
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const approvedCacheName = await getServingCacheName();
      const keep = new Set([META_CACHE_NAME, approvedCacheName, CACHE_NAME]);
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => !keep.has(key))
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  const message = event.data || {};

  if (message.type === "SKIP_WAITING") {
    event.waitUntil(
      (async () => {
        await writeActiveCacheName(CACHE_NAME);
        self.skipWaiting();
      })()
    );
    return;
  }

  if (message.type === "GET_CURRENT_VERSION") {
    event.waitUntil(
      (async () => {
        const version = await getCachedCurrentVersion();
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ version });
        }
      })()
    );
    return;
  }

  if (message.type === "APPLY_APP_UPDATE") {
    event.waitUntil(
      (async () => {
        let ok = false;

        try {
          const activeCacheName = await getServingCacheName();
          await cacheCoreAssets(activeCacheName);
          await writeActiveCacheName(activeCacheName);
          ok = true;
        } catch {
          ok = false;
        }

        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ ok });
        }
      })()
    );
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (isLatestVersionRequest(url)) {
    event.respondWith(
      fetch(req, { cache: "no-store" }).catch(() => new Response("", { status: 503, statusText: "Offline" }))
    );
    return;
  }

  const cacheKey = req.mode === "navigate" ? "./index.html" : getCoreCacheKey(url);
  if (!cacheKey) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(await getServingCacheName());
      const cached = await cache.match(cacheKey);
      if (cached) return cached;
      return fetch(req);
    })()
  );
});
