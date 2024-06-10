import type { CurrencyData } from '$lib/calculator';
import { EXCHANGERATE_KEY } from '$env/static/private';

interface Platform {
	env: {
		CACHE: any | null;
	};
}

export async function GET({
	platform,
}: {
	platform: Platform;
}): Promise<Response> {
	if (!EXCHANGERATE_KEY) {
		throw new Error('EXCHANGERATE_KEY not set');
	}

	if (platform.env.CACHE) {
		const cachedEntry = await platform.env.CACHE.get('currencyData');
		if (cachedEntry.timestamp > Date.now() - 12 * 3600 * 1000) {
			return new Response(JSON.stringify(cachedEntry.data), {
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
					'cache-control': `public, max-age=${6 * 3600}`,
				},
			});
		}
	}

	const resp = await fetch(
		`http://api.exchangerate.host/live?source=EUR&access_key=${EXCHANGERATE_KEY}`,
	);
	if (!resp.ok)
		throw new Error(`error fetching currency data: ${resp.statusText}`);

	const data = await resp.json();

	if (!data.success) {
		throw new Error(data.error.info as string);
	}

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

	if (platform.env.CACHE) {
		await platform.env.CACHE.put('currencyData', {
			timestamp: Date.now(),
			data: body,
		});
	}

	return new Response(JSON.stringify(body), {
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
			'cache-control': `public, max-age=${6 * 3600}`,
		},
	});
}
