import type { IpGeo } from '#lib/tools/ip';

const ENDPOINT = 'http://ip-api.com/json';

const FIELDS = [
	'status',
	'message',
	'continent',
	'continentCode',
	'country',
	'countryCode',
	'region',
	'regionName',
	'city',
	'district',
	'zip',
	'lat',
	'lon',
	'timezone',
	'offset',
	'currency',
	'isp',
	'org',
	'as',
	'asname',
	'reverse',
	'mobile',
	'proxy',
	'hosting',
	'query'
].join(',');

const CACHE_TTL = 10 * 60 * 1000;
const CACHE_MAX = 250;

const cache = new Map<string, { at: number; geo: IpGeo }>();

let cooldownUntil = 0;

export type GeoResult =
	{ ok: true; geo: IpGeo; cached: boolean } | { ok: false; error: string; status: number };

function readCache(key: string): IpGeo | null {
	const hit = cache.get(key);
	if (!hit) return null;
	if (Date.now() - hit.at > CACHE_TTL) {
		cache.delete(key);
		return null;
	}
	return hit.geo;
}

function writeCache(key: string, geo: IpGeo) {
	if (cache.size >= CACHE_MAX) {
		const oldest = cache.keys().next().value;
		if (oldest !== undefined) cache.delete(oldest);
	}
	cache.set(key, { at: Date.now(), geo });
}

export async function fetchGeo(fetchFn: typeof fetch, query: string | null): Promise<GeoResult> {
	const key = (query ?? 'self').toLowerCase();

	const cached = readCache(key);
	if (cached) return { ok: true, geo: cached, cached: true };

	if (Date.now() < cooldownUntil) {
		return {
			ok: false,
			error: 'ip-api.com rate limit reached for this server. Try again shortly.',
			status: 429
		};
	}

	const url = query
		? `${ENDPOINT}/${encodeURIComponent(query)}?fields=${FIELDS}`
		: `${ENDPOINT}/?fields=${FIELDS}`;

	try {
		const res = await fetchFn(url, {
			headers: { accept: 'application/json' },
			signal: AbortSignal.timeout(8_000)
		});

		const remaining = Number(res.headers.get('x-rl'));
		const resetIn = Number(res.headers.get('x-ttl'));
		if (Number.isFinite(remaining) && remaining <= 0 && Number.isFinite(resetIn)) {
			cooldownUntil = Date.now() + resetIn * 1000;
		}

		if (res.status === 429) {
			return { ok: false, error: 'ip-api.com rate limit reached. Try again shortly.', status: 429 };
		}

		if (!res.ok) {
			return { ok: false, error: `ip-api.com returned ${res.status}.`, status: 502 };
		}

		let data: IpGeo;
		try {
			data = (await res.json()) as IpGeo;
		} catch {
			return { ok: false, error: 'ip-api.com returned an unreadable response.', status: 502 };
		}

		if (data.status === 'fail') {
			const reason = data.message ?? 'Lookup failed.';
			const mapped = /invalid|reserved|private/i.test(reason) ? 422 : 502;
			return { ok: false, error: `ip-api.com: ${reason}.`, status: mapped };
		}

		writeCache(key, data);
		return { ok: true, geo: data, cached: false };
	} catch {
		return { ok: false, error: 'Could not reach ip-api.com.', status: 504 };
	}
}
