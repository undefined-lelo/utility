export type CheckType = 'http' | 'ping' | 'tcp' | 'dns';

export type CheckNodeMeta = [cc: string, country: string, city: string, ip: string, asn: string];

export interface CheckStart {
	ok: number;
	request_id: string;
	permanent_link: string;
	nodes: Record<string, CheckNodeMeta>;
}

export type CheckResults = Record<string, unknown>;

export type RowState = 'ok' | 'fail' | 'pending';

export interface CheckRow {
	id: string;
	country: string;
	city: string;
	asn: string;
	ip: string;
	state: RowState;
	latency?: number;
	summary: string;
	detail?: string;
}

const num = (v: unknown): number | undefined =>
	typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 1000) / 1000 : undefined;

function httpRow(value: unknown): Pick<CheckRow, 'state' | 'latency' | 'summary' | 'detail'> {
	if (!Array.isArray(value) || value.length === 0) return { state: 'pending', summary: 'running' };

	const first = value[0];
	const entry = (Array.isArray(first) ? first : value) as unknown[];
	const [ok, time, message, code, ip] = entry;

	const label = [code, message]
		.filter((part) => part !== null && part !== undefined && part !== '')
		.join(' ')
		.trim();

	return {
		state: ok === 1 ? 'ok' : 'fail',
		latency: num(time),
		summary: label || (ok === 1 ? 'OK' : 'failed'),
		detail: typeof ip === 'string' ? (ok === 1 ? `resolved ${ip}` : `server ${ip}`) : undefined
	};
}

function pingRow(value: unknown): Pick<CheckRow, 'state' | 'latency' | 'summary' | 'detail'> {
	if (!Array.isArray(value) || value.length === 0) return { state: 'pending', summary: 'running' };

	const first = value[0];
	const attempts: unknown[] =
		Array.isArray(first) && Array.isArray(first[0]) ? (first as unknown[]) : value;
	const replies = attempts.map((attempt) => (Array.isArray(attempt) ? attempt : []));

	if (replies.length === 0) return { state: 'pending', summary: 'running' };

	const successful = replies.filter((reply) => reply[0] === 'OK');
	const times = successful
		.map((reply) => num(reply[1]))
		.filter((time): time is number => time !== undefined);

	const failed = replies.filter((reply) => reply[0] !== 'OK');
	const total = replies.length;
	const okCount = successful.length;

	if (okCount === 0) {
		const label = failed[0]?.[0];
		return {
			state: 'fail',
			summary: typeof label === 'string' ? label.toLowerCase() : 'no replies',
			detail: `${total} attempts`
		};
	}

	const best = times.length ? Math.min(...times) : undefined;
	const avg = times.length ? times.reduce((sum, time) => sum + time, 0) / times.length : undefined;

	return {
		state: okCount === total ? 'ok' : 'fail',
		latency: best !== undefined ? num(best) : undefined,
		summary: `${okCount}/${total} replies`,
		detail:
			avg !== undefined && best !== undefined
				? `avg ${avg.toFixed(1)} ms · best ${best} ms`
				: undefined
	};
}

function tcpRow(value: unknown): Pick<CheckRow, 'state' | 'latency' | 'summary' | 'detail'> {
	if (value === null || value === undefined) return { state: 'pending', summary: 'running' };
	const first = Array.isArray(value) ? value[0] : value;
	if (!first || typeof first !== 'object') return { state: 'pending', summary: 'running' };

	const entry = first as { time?: number; address?: string; error?: string };
	if (entry.error) return { state: 'fail', summary: entry.error.toLowerCase() };
	if (entry.time !== undefined) {
		return { state: 'ok', latency: num(entry.time), summary: 'connected', detail: entry.address };
	}
	return { state: 'pending', summary: 'running' };
}

function dnsRow(value: unknown): Pick<CheckRow, 'state' | 'latency' | 'summary' | 'detail'> {
	if (value === null || value === undefined) return { state: 'pending', summary: 'running' };
	const first = Array.isArray(value) ? value[0] : value;
	if (!first || typeof first !== 'object') return { state: 'pending', summary: 'running' };

	const entry = first as { A?: string[]; AAAA?: string[]; TTL?: number | null };
	const a = entry.A ?? [];
	const aaaa = entry.AAAA ?? [];
	if (!a.length && !aaaa.length) return { state: 'fail', summary: 'no records resolved' };

	return {
		state: 'ok',
		summary: `${a.length} A · ${aaaa.length} AAAA`,
		detail: [...a, ...aaaa].slice(0, 4).join(', '),
		latency: undefined
	};
}

const ROWERS: Record<
	CheckType,
	(value: unknown) => Pick<CheckRow, 'state' | 'latency' | 'summary' | 'detail'>
> = {
	http: httpRow,
	ping: pingRow,
	tcp: tcpRow,
	dns: dnsRow
};

export function normalizeResults(
	type: CheckType,
	nodes: Record<string, CheckNodeMeta>,
	results: CheckResults | null
): CheckRow[] {
	return Object.entries(nodes).map(([id, meta]) => {
		const [cc, country, city, ip, asn] = Array.isArray(meta) ? meta : [];
		const raw = results ? results[id] : undefined;
		const shaped =
			raw === undefined ? { state: 'pending' as const, summary: 'queued' } : ROWERS[type](raw);

		return {
			id,
			country: country ?? cc ?? '—',
			city: city ?? '—',
			asn: asn ?? '—',
			ip: ip ?? '—',
			...shaped
		};
	});
}

export function isSettled(rows: CheckRow[]): boolean {
	return rows.length > 0 && rows.every((row) => row.state !== 'pending');
}
