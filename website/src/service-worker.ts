/* eslint-disable no-restricted-globals */
/// <reference lib="webworker" />

// eslint-disable-next-line import/no-unresolved
import { build, files, version } from '$service-worker';

const currencyDataApiUrl = '/api/getCurrencyData';

const worker = self as unknown as ServiceWorkerGlobalScope;
const CACHE_KEY = `cache-${version}`;

const toCache = build.concat(files).concat(['/', currencyDataApiUrl]);
const staticAssets = new Set(toCache);

self.addEventListener('message', async (evt) => {
	if (evt.data?.type === 'update') {
		await worker.skipWaiting();
		const clients = await worker.clients.matchAll();
		clients.forEach((client) => client.postMessage({ type: 'reload' }));
	}
});

worker.addEventListener('install', (event) => {
	const preCache = async () => {
		const cache = await caches.open(CACHE_KEY);
		await cache.addAll(toCache);
	};
	event.waitUntil(preCache());
});

worker.addEventListener('activate', (event) => {
	const deleteOldCache = async () => {
		const keys = await caches.keys();
		const promises = keys
			.filter((key) => key !== CACHE_KEY)
			.map((key) => caches.delete(key));
		await Promise.all(promises);
		await worker.clients.claim();
	};
	event.waitUntil(deleteOldCache());
});

async function fetchAndCache(req: Request) {
	const cache = await caches.open(CACHE_KEY);
	try {
		const resp = await fetch(req);
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		cache.put(req, resp.clone());
		return resp;
	} catch (err) {
		const resp = await cache.match(req);
		if (resp) {
			return resp;
		}
		throw err;
	}
}

worker.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET' || event.request.headers.has('range'))
		return;

	const url = new URL(event.request.url);

	const isHttp = url.protocol.startsWith('http');
	const isDevServerRequest =
		url.hostname === self.location.hostname &&
		url.port !== self.location.port;
	const isStaticAsset =
		url.host === self.location.host && staticAssets.has(url.pathname);
	const skipBecauseUncached =
		event.request.cache === 'only-if-cached' && !isStaticAsset;
	const isCurrencyDataRequest = url.pathname === currencyDataApiUrl;

	if (!isHttp || isDevServerRequest || skipBecauseUncached) return;

	const cachedAssetPromise = isStaticAsset && caches.match(event.request);

	if (isCurrencyDataRequest) {
		const cacheAndFetchCurrencies = async () => {
			const fetchedAssetPromise = fetchAndCache(event.request);
			const cachedAsset = await cachedAssetPromise;
			if (!cachedAsset) return fetchedAssetPromise;
			// eslint-disable-next-line @typescript-eslint/no-floating-promises
			fetchedAssetPromise.then(async (response) => {
				const currencyData = await response.json();
				const clients = await worker.clients.matchAll();
				clients.forEach((client) =>
					client.postMessage({
						type: 'updateCurrencyData',
						data: currencyData,
					}),
				);
			});
			return cachedAsset;
		};
		event.respondWith(cacheAndFetchCurrencies());
		return;
	}

	const cacheOrFetch = async () =>
		(await cachedAssetPromise) || fetchAndCache(event.request);
	event.respondWith(cacheOrFetch());
});
