/* eslint-disable no-restricted-globals */
/// <reference lib="webworker" />

import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, Serwist, StaleWhileRevalidate } from "serwist";

declare const self: ServiceWorkerGlobalScope;
declare global {
	interface WorkerGlobalScope extends SerwistGlobalConfig {
		__SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
	}
}
const currencyDataApiUrl = '/api/getCurrencyData';

const serwist = new Serwist({
	precacheEntries: self.__SW_MANIFEST,
	skipWaiting: true,
	clientsClaim: true,
	navigationPreload: true,
	precacheOptions: {
		cleanupOutdatedCaches: true,
	},
	runtimeCaching: [
		{
			// refetch & update currency data
			matcher: ({ request }) => request.url === currencyDataApiUrl,
			handler: new StaleWhileRevalidate({
				plugins: [{
					async fetchDidSucceed({ response }) {
						if (response.status != 200) {
							console.error("error fetching currencyData");
						}
						const currencyData = await response.json();
						const clients = await self.clients.matchAll();
						clients.forEach((client) =>
							client.postMessage({
								type: 'updateCurrencyData',
								data: currencyData,
							}),
						);
						return response;
					}
				}]
			})
		},
		{
			matcher: () => true,
			handler: new CacheFirst(),
		}
	],
});

serwist.addEventListeners();
