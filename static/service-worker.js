const CACHE = 'pixipalette-v1';
const APP_SHELL = ['/', '/offline.html', '/manifest.json'];

self.addEventListener('install', (e) => {
	e.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP_SHELL)));
	self.skipWaiting();
});

self.addEventListener('activate', (e) => {
	e.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
	);
	self.clients.claim();
});

self.addEventListener('fetch', (e) => {
	const { request } = e;
	if (request.method !== 'GET') return;

	// navigation → network-first, fallback to cache (offline)
	if (request.mode === 'navigate') {
		e.respondWith(fetch(request).catch(() => caches.match('/')));
		return;
	}

	// everything else → cache-first, then network (and cache it)
	e.respondWith(
		caches.match(request).then(
			(cached) =>
				cached ||
				fetch(request).then((res) => {
					const copy = res.clone();
					caches.open(CACHE).then((c) => c.put(request, copy));
					return res;
				})
		)
	);
});
