import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, fetch, setHeaders }) => {
	const id = (params.id ?? '').trim();

	if (!/^[a-z0-9]{4,32}$/i.test(id)) {
		return json({ error: 'Invalid request id.' }, { status: 400 });
	}

	setHeaders({ 'cache-control': 'no-store' });

	try {
		const res = await fetch(`https://check-host.net/check-result/${id}`, {
			headers: { accept: 'application/json' },
			signal: AbortSignal.timeout(15_000)
		});

		if (!res.ok) {
			return json({ error: `check-host.net returned ${res.status}.` }, { status: 502 });
		}

		const text = await res.text();
		try {
			return new Response(text, {
				headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
			});
		} catch {
			return json({ error: 'check-host.net returned an unreadable response.' }, { status: 502 });
		}
	} catch {
		return json({ error: 'Could not reach check-host.net.' }, { status: 504 });
	}
};
