export interface CurrencyData {
	base: string;
	date: string;
	rates: Record<string, string>;
}

export async function GET() {
	if (process.env.CACHE) {
		const cachedEntry = JSON.parse(
			(await process.env.CACHE.get("currencyData")) as string,
		);
		if (cachedEntry.timestamp > Date.now() - 12 * 3600 * 1000) {
			return new Response(JSON.stringify(cachedEntry.data), {
				headers: {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*",
					"cache-control": `public, max-age=${6 * 3600}`,
				},
			});
		}
	}

	let body: CurrencyData = {
		date: new Date().toISOString(),
		base: "EUR",
		rates: {},
	};

	if (!process.env.EXCHANGERATE_KEY) {
		console.warn("Warning: No EXCHANGERATE_KEY defined");
	} else {
		const resp = await fetch(
			`http://api.exchangerate.host/live?source=EUR&access_key=${process.env.EXCHANGERATE_KEY}`,
		);
		if (!resp.ok)
			throw new Error(`error fetching currency data: ${resp.statusText}`);

		const data = await resp.json();

		if (!data.success) {
			throw new Error(data.error.info as string);
		}

		body = {
			date: new Date(data.timestamp * 1000).toISOString(),
			base: data.source,
			rates: Object.fromEntries<string>(
				Object.entries(data.quotes as Record<string, string>).map(
					([name, value]) => [name.substring(3), (1 / +value).toString()],
				),
			),
		};
	}

	if (process.env.CACHE) {
		await process.env.CACHE.put(
			"currencyData",
			JSON.stringify({
				timestamp: Date.now(),
				data: body,
			}),
		);
	}

	return new Response(JSON.stringify(body), {
		headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*",
			"cache-control": `public, max-age=${6 * 3600}`,
		},
	});
}
