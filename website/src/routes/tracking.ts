/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-underscore-dangle */

// eslint-disable-next-line import/no-unresolved, import/extensions
import { page } from '$app/stores';

const isClient = typeof window !== 'undefined';
let trackingEnabled = false;

const _paq: (string | number)[][] = (isClient && (window as any)._paq) || [];
if (isClient) (window as any)._paq = _paq;

export function setupTracking(enable: boolean) {
	if (enable && isClient && process.env.NODE_ENV !== 'development') {
		trackingEnabled = true;
		_paq.push(['enableLinkTracking']);
		(function createTracking() {
			const u = '//analytics.tonalio.com/';
			_paq.push(['setTrackerUrl', `${u}matomo.php`]);
			_paq.push(['setSiteId', '2']);
			const d = document;
			const g = d.createElement('script');
			const s = d.getElementsByTagName('script')[0];
			g.async = true;
			g.src = `${u}matomo.js`;
			s.parentNode!.insertBefore(g, s);
		})();
		page.subscribe(({ url }) => {
			_paq.push(['setCustomUrl', url.pathname]);
			_paq.push(['setDocumentTitle', document.title]);
			_paq.push(['trackPageView']);
			_paq.push(['enableLinkTracking']);
		});
	}
}

export function trackEvent(
	category: string,
	action: string,
	name?: string,
	value?: number,
) {
	if (!trackingEnabled) return;
	const eventArgs: (string | number)[] = [category, action];
	if (name) {
		eventArgs.push(name);
		if (value) {
			eventArgs.push(value);
		}
	}
	_paq.push(['trackEvent', ...eventArgs]);
}
