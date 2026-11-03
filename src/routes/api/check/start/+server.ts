import { json } from '@sveltejs/kit';
import { take } from '#lib/server/ratelimit';
import type { CheckType } from '#lib/tools/checkhost';
import type { RequestHandler } from './$types';

const TYPES: CheckType[] = ['http', 'ping', 'tcp', 'dns'];

interface Body {
	type?: string;
	host?: string;
	maxNodes?: number;
}

function normalizeHost(type: CheckType, raw: string): string | null {
	const value = raw.trim();
	if (!value || value.length > 200 || /\s/.test(value)) return null;

	if (type === 'http') {
		const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
		try {
			const url = new URL(withScheme);
			return url.hostname ? withScheme : null;
		} catch {
			return null;
		}
	}

	const stripped = value.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '').replace(/\/.*$/, '');
	if (!stripped) return null;
	if (type === 'tcp') return /:\d{1,5}$/.test(stripped) ? stripped : `${stripped}:443`;
	return stripped;
}

export const POST: RequestHandler = async ({ request, getClientAddress, fetch }) => {
	let address = 'anonymous';
	try {
		address = getClientAddress();
	} catch {}

	const limit = take(`check:${address}`, 8_000);
	if (!limit.allowed) {
		return json(
			{
				error: `Slow down — check-host allows a few checks per minute. Retry in ${limit.retryAfter}s.`
			},
			{ status: 429, headers: { 'retry-after': String(limit.retryAfter) } }
		);
	}

	const body = (await request.json().catch(() => null)) as Body | null;
	const type = body?.type as CheckType | undefined;

	if (!type || !TYPES.includes(type)) {
		return json({ error: 'Pick a check type: http, ping, tcp or dns.' }, { status: 400 });
	}

	const host = normalizeHost(type, body?.host ?? '');
	if (!host) {
		return json(
			{ error: 'That host is not valid. Try example.com or https://example.com.' },
			{ status: 400 }
		);
	}

	const maxNodes = Math.min(10, Math.max(1, Math.round(Number(body?.maxNodes) || 6)));

	const url = new URL(`https://check-host.net/check-${type}`);
	url.searchParams.set('host', host);
	url.searchParams.set('max_nodes', String(maxNodes));

	try {
		const res = await fetch(url, {
			headers: { accept: 'application/json' },
			signal: AbortSignal.timeout(15_000)
		});

		const text = await res.text();

		if (!res.ok) {
			return json(
				{ error: `check-host.net rejected the request (${res.status}).` },
				{ status: 502 }
			);
		}

		let data: { request_id?: string; nodes?: Record<string, unknown> };
		try {
			data = JSON.parse(text);
		} catch {
			return json({ error: 'check-host.net returned an unreadable response.' }, { status: 502 });
		}

		if (!data.request_id) {
			return json({ error: 'check-host.net did not return a request id.' }, { status: 502 });
		}

		return json({ ...data, type, host });
	} catch {
		return json({ error: 'Could not reach check-host.net.' }, { status: 504 });
	}
};
