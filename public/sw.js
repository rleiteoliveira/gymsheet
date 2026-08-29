const requestedBuildId = new URL(self.location.href).searchParams.get('build');
const BUILD_ID = /^[a-zA-Z0-9._-]{1,80}$/.test(requestedBuildId || '') ? requestedBuildId : 'dev';
const CACHE_NAME = `gymsheet-shell-${BUILD_ID}`;
const SHELL = ['/', '/manifest.webmanifest', '/icon.svg', '/build-meta.json'];

function isNavigation(request) {
  return request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html');
}

async function networkFirst(request) {
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (isNavigation(request)) {
      const fallback = await caches.match('/');
      if (fallback) return fallback;
    }
    throw error;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => (key.startsWith('gymsheet-shell-') || key === 'treino-de-hoje-shell-v1') && key !== CACHE_NAME)
        .map((key) => caches.delete(key)),
    )),
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (url.pathname === '/sw.js') return;
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.hostname === 'raw.githubusercontent.com' && url.pathname.includes('/exercises/')) {
    event.respondWith(cacheFirst(request));
  }
});
