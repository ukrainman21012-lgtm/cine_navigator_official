const CACHE_NAME = "cine-navigator-shell-v3";
const APP_SHELL = [
  "./index.html",
  "./styles.css",
  "./redesign.css",
  "./script.js",
  "./radar.js",
  "./live-features.js",
  "./personalization.js",
  "./cinema-extras.js",
  "./nebula.js",
  "./manifest.json",
  "./icon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(APP_SHELL.map(async asset => {
        const request = new Request(asset, { cache: "reload" });
        const response = await fetch(request);
        if (!response.ok || response.type === "opaque") {
          throw new Error(`Unable to precache ${asset}: ${response.status}`);
        }
        await cache.put(request, response);
      }));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      if (response.ok && response.type === "basic") {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      if (request.mode === "navigate") {
        const appShell = new URL("./index.html", self.registration.scope).href;
        const fallback = await caches.match(appShell);
        if (fallback) return fallback;
      }
      throw error;
    }
  })());
});