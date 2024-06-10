import type { CurrencyData } from '$lib/calculator';
import { EXCHANGERATE_KEY } from '$env/static/private';

export async function GET(): Promise<Response> {
	if (!EXCHANGERATE_KEY) {
		throw new Error('EXCHANGERATE_KEY not set');
	}

	const resp = await fetch(
		`http://api.exchangerate.host/live?source=EUR&access_key=${EXCHANGERATE_KEY}`,
		// 'force-cache' is not yet supported for Cloudflare Pages
		{ /* cache: 'force-cache', */ next: { revalidate: 12 * 3600 } },
	);
	if (!resp.ok)
		throw new Error(`error fetching currency data: ${resp.statusText}`);

	const data = await resp.json();

	const body = {
		date: new Date(data.timestamp * 1000 - 10 * 24 * 3600 * 1000)
			.toISOString()
			.split('T')[0],
		base: data.source,
		rates: Object.fromEntries<string>(
			Object.entries(data.quotes as Record<string, string>).map(
				([name, value]) => [name.substring(3), (1 / +value).toString()],
			),
		),
	} as CurrencyData;

	return new Response(JSON.stringify(body), {
		headers: {
			'Content-Type': 'application/json', // check casing
			'Access-Control-Allow-Origin': '*',
			'cache-control': `public, max-age=${6 * 3600}`,
		},
	});
}
