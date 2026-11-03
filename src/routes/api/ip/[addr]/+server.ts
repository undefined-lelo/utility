import { json } from '@sveltejs/kit';
import { fetchGeo } from '#lib/server/geo';
import { isHostname, isIpLike } from '#lib/tools/ip';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, fetch, setHeaders }) => {
	const query = decodeURIComponent(params.addr ?? '').trim();

	if (!isIpLike(query) && !isHostname(query)) {
		return json(
			{ error: 'That is not an IPv4, IPv6 or domain name. Try 8.8.8.8 or example.com.' },
			{ status: 400 }
		);
	}

	setHeaders({ 'cache-control': 'public, max-age=300' });

	const result = await fetchGeo(fetch, query);
	if (!result.ok) {
		return json({ query, geo: null, error: result.error }, { status: result.status });
	}

	return json({ query, geo: result.geo, cached: result.cached });
};
