/* GK Airwin offline cache: network-first for same-origin GET requests.
   After the first online visit, the app keeps opening and playing offline. */
const CACHE = "gk-airwin-v2";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never retain privileged screens or API responses in the offline cache.
  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/") || url.pathname.startsWith("/_serverFn/")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && !/no-store|private/i.test(response.headers.get("cache-control") ?? "")) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          const shell = await caches.match("/");
          if (shell) return shell;
        }
        return Response.error();
      }),
  );
});
