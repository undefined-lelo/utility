import { json } from '@sveltejs/kit';
import { fetchGeo } from '#lib/server/geo';
import { isPrivateIp } from '#lib/tools/ip';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ getClientAddress, fetch, setHeaders }) => {
	let address = '';
	try {
		address = getClientAddress();
	} catch {
		address = '';
	}

	setHeaders({ 'cache-control': 'no-store' });

	if (!address) {
		return json({
			query: null,
			local: true,
			geo: null,
			note: 'This server cannot see your address. Enter an address or domain instead.'
		});
	}

	if (isPrivateIp(address)) {
		return json({
			query: address,
			local: true,
			geo: null,
			note: 'You are on a private or loopback address, so there is nothing to geolocate. Enter a public address to test the lookup.'
		});
	}

	const result = await fetchGeo(fetch, address);
	if (!result.ok) {
		return json({ query: address, geo: null, error: result.error }, { status: result.status });
	}

	return json({ query: address, geo: result.geo, cached: result.cached });
};
