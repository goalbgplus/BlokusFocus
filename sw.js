// Cache name updated to force clients to pick up new assets when deployed
// IMPORTANT: Increment this version to force cache bust
const CACHE='blokus-grid-v7';
const CSS_VERSION = '3.3';

self.addEventListener('install', e => {
	// Skip waiting to activate immediately
	self.skipWaiting();
});

self.addEventListener('activate', e => {
	e.waitUntil((async () => {
		// Delete ALL old caches
		const keys = await caches.keys();
		await Promise.all(keys.map(k => caches.delete(k)));
		// Claim all clients immediately
		await self.clients.claim();
		console.log('[SW] Activated v7, cleared all caches');
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

	// For CSS and JS files, always try network first (critical for updates)
	if (url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
		e.respondWith((async () => {
			try {
				const resp = await fetch(req);
				// Only cache successful responses
				if (resp.ok) {
					const cache = await caches.open(CACHE);
					cache.put(req, resp.clone());
				}
				return resp;
			} catch (err) {
				// Fallback to cache only if network fails
				const cached = await caches.match(req);
				return cached || Response.error();
			}
		})());
		return;
	}

	// For other assets, use cache-first
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
