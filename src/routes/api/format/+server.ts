import { json } from '@sveltejs/kit';
import { formatCode } from '#lib/server/format';
import { take } from '#lib/server/ratelimit';
import { isLang } from '#lib/tools/parsers/index';
import type { RequestHandler } from './$types';

const MAX_CHARS = 200_000;

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	let address = 'anonymous';
	try {
		address = getClientAddress();
	} catch {}

	const limit = take(`format:${address}`, 600);
	if (!limit.allowed) {
		return json(
			{ error: `Slow down. Retry in ${limit.retryAfter}s.` },
			{ status: 429, headers: { 'retry-after': String(limit.retryAfter) } }
		);
	}

	const body = (await request.json().catch(() => null)) as {
		lang?: string;
		code?: string;
		typescript?: boolean;
	} | null;

	if (!body?.lang || !isLang(body.lang)) {
		return json({ error: 'Unknown language.' }, { status: 400 });
	}

	if (typeof body.code !== 'string') {
		return json({ error: 'Send the source as `code`.' }, { status: 400 });
	}

	if (body.code.length > MAX_CHARS) {
		return json(
			{ error: `That file is over ${MAX_CHARS.toLocaleString()} characters.` },
			{ status: 413 }
		);
	}

	const result = await formatCode(body.lang, body.code, { typescript: body.typescript ?? false });

	if (!result.ok) {
		return json({ error: result.error ?? 'Could not format that source.' }, { status: 422 });
	}

	return json({ code: result.code });
};
