const CACHE = "barcaora-shell-v2";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => key.startsWith("barcaora-shell-") ? caches.delete(key) : Promise.resolve(false)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request));
});
