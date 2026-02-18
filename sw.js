// sw.js（安定版）
// 更新したら VERSION だけ変える（v1 → v2 → v3…）
const VERSION = "v1";
const CACHE_NAME = `weekly-plan-${VERSION}`;

// キャッシュしたい最低限のファイル（必要に応じて追加）
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./sw.js",
  "./data.js"
];

// インストール時：必要ファイルをキャッシュ
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// 有効化時：古いキャッシュを削除
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("weekly-plan-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// 取得時：キャッシュ優先、なければネット → 失敗時はトップへ
self.addEventListener("fetch", (event) => {
  // GET以外は触らない
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((res) => {
          // 取得できたらキャッシュに保存して次回を安定させる
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match("./"));
    })
  );
});
