// Cache name updated to force clients to pick up new assets when deployed
const CACHE='blokus-grid-v3';

self.addEventListener('install', e => self.skipWaiting());

self.addEventListener('activate', e => {
	e.waitUntil((async () => {
		const keys = await caches.keys();
		await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
		await self.clients.claim();
	})());
});

self.addEventListener('fetch', e => {
	const req = e.request;
	if (req.method !== 'GET') return;
	const url = new URL(req.url);

	// Navigation fallback to index.html
	if (req.mode === 'navigate') {
		e.respondWith((async () => {
			try { return await fetch(req); }
			catch (err) {
				return (await caches.match('/index.html')) || (await caches.match('index.html')) || Response.error();
			}
		})());
		return;
	}

	if (url.origin === location.origin) {
		e.respondWith((async () => {
			const cached = await caches.match(req);
			if (cached) return cached;
			try {
				const resp = await fetch(req);
				const copy = resp.clone();
				const cache = await caches.open(CACHE);
				cache.put(req, copy);
				return resp;
			} catch (err) {
				return cached || Response.error();
			}
		})());
	}
});
