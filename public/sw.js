// DevWorks Studio — Service Worker
// Strategy:
//   - KB pages (/dashboard/knowledge*) → stale-while-revalidate (serve from cache, update in BG)
//   - Next.js static chunks → cache-first (never change)
//   - Everything else → network with cache fallback

const SHELL_CACHE = "devworks-shell-v1";
const KB_CACHE = "devworks-kb-v1";

// On install: take control immediately, no waiting
self.addEventListener("install", () => {
  self.skipWaiting();
});

// On activate: delete caches from old versions, claim all clients
self.addEventListener("activate", (event) => {
  const currentCaches = [SHELL_CACHE, KB_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !currentCaches.includes(k))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests over HTTP(S)
  if (request.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;

  // Skip Supabase API calls — IndexedDB handles offline data at app level
  if (url.hostname.includes("supabase.co")) return;

  // Next.js static assets (immutable, content-hashed filenames) → cache-first
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  // KB page navigations → stale-while-revalidate
  // This ensures the page shell always loads instantly, even offline
  if (url.pathname.startsWith("/dashboard/knowledge")) {
    event.respondWith(staleWhileRevalidate(request, KB_CACHE));
    return;
  }

  // Other dashboard pages → network with cache fallback
  if (url.pathname.startsWith("/dashboard")) {
    event.respondWith(networkWithCacheFallback(request, SHELL_CACHE));
    return;
  }
});

// --- Strategies ---

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Always try to refresh in the background
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  // Return cached immediately if available, otherwise wait for network
  return cached ?? networkPromise;
}

async function networkWithCacheFallback(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached ?? new Response("Offline", { status: 503 });
  }
}
