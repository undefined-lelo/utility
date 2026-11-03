const hits = new Map<string, number>();

export function take(key: string, windowMs: number): { allowed: boolean; retryAfter: number } {
	const now = Date.now();
	const last = hits.get(key) ?? 0;

	if (now - last < windowMs) {
		return { allowed: false, retryAfter: Math.ceil((windowMs - (now - last)) / 1000) };
	}

	hits.set(key, now);
	if (hits.size > 5000) hits.clear();
	return { allowed: true, retryAfter: 0 };
}
