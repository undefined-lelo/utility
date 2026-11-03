<script lang="ts">
	import { untrack } from 'svelte';
	import NodeResultsTable from '#lib/components/NodeResultsTable.svelte';
	import {
		normalizeResults,
		type CheckNodeMeta,
		type CheckResults,
		type CheckType
	} from '#lib/tools/checkhost';

	const TYPES: { id: CheckType; label: string; hint: string }[] = [
		{ id: 'http', label: 'HTTP', hint: 'Fetches the page and reports status and timing.' },
		{ id: 'ping', label: 'Ping', hint: 'Four ICMP echo requests per node.' },
		{ id: 'tcp', label: 'TCP', hint: 'Socket connect. Defaults to port 443.' },
		{ id: 'dns', label: 'DNS', hint: 'A and AAAA lookups per node.' }
	];

	let type = $state<CheckType>('http');
	let host = $state('example.com');
	let maxNodes = $state(6);

	let status = $state<'idle' | 'running' | 'done' | 'error'>('idle');
	let errorMessage = $state('');
	let requestId = $state<string | null>(null);
	let permanentLink = $state('');
	let nodes = $state<Record<string, CheckNodeMeta>>({});
	let results = $state<CheckResults | null>(null);

	const selectedType = $derived(TYPES.find((entry) => entry.id === type) ?? TYPES[0]);
	const rows = $derived(normalizeResults(type, nodes, results));
	const counts = $derived({
		ok: rows.filter((row) => row.state === 'ok').length,
		fail: rows.filter((row) => row.state === 'fail').length,
		pending: rows.filter((row) => row.state === 'pending').length
	});

	async function run() {
		status = 'running';
		errorMessage = '';
		requestId = null;
		permanentLink = '';
		nodes = {};
		results = null;

		try {
			const res = await fetch('/api/check/start', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ type, host, maxNodes })
			});

			const data = await res.json();

			if (!res.ok) {
				errorMessage = data?.error ?? `Request failed (${res.status}).`;
				status = 'error';
				return;
			}

			nodes = (data.nodes ?? {}) as Record<string, CheckNodeMeta>;
			permanentLink = data.permanent_link ?? '';
			requestId = data.request_id ?? null;

			if (!requestId) {
				errorMessage = 'The checker did not return a request id.';
				status = 'error';
			}
		} catch {
			errorMessage = 'Could not reach the checker proxy.';
			status = 'error';
		}
	}

	$effect(() => {
		const id = requestId;
		if (!id) return;

		let cancelled = false;
		let timer: ReturnType<typeof setTimeout>;
		let attempts = 0;

		const poll = async () => {
			if (cancelled) return;
			attempts++;

			try {
				const res = await fetch(`/api/check/result/${id}`);
				if (res.ok) {
					const data = (await res.json()) as CheckResults;
					if (cancelled) return;
					results = data;

					const pending = untrack(() =>
						normalizeResults(type, nodes, data).some((row) => row.state === 'pending')
					);
					if (!pending) {
						status = 'done';
						return;
					}
				}
			} catch {}

			if (cancelled) return;
			if (attempts >= 40) {
				status = 'done';
				return;
			}
			timer = setTimeout(poll, 1400);
		};

		timer = setTimeout(poll, 700);

		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	});
</script>

<svelte:head>
	<title>Site checker · utility</title>
</svelte:head>

<header class="mb-8">
	<p class="label">Network</p>
	<h1 class="mt-1 text-[24px] font-medium tracking-[-0.01em]">Site Checker</h1>
	<p class="mt-2 max-w-[62ch] text-[13px] leading-relaxed text-mut">
		Runs one check from nodes in several countries and reports each node separately. Data comes from <a
			class="text-fg underline decoration-line-strong underline-offset-4 hover:decoration-fg"
			href="https://check-host.net/about/api"
			target="_blank"
			rel="noreferrer">check-host.net</a
		>, proxied so their API is never called from your browser.
	</p>
</header>

<form
	class="panel p-4 sm:p-5"
	onsubmit={(event) => {
		event.preventDefault();
		run();
	}}
>
	<div class="flex flex-col gap-3 sm:flex-row sm:items-end">
		<label class="block flex-1" for="host">
			<span class="label mb-1.5 block">Host</span>
			<input
				id="host"
				bind:value={host}
				class="field"
				placeholder="example.com"
				spellcheck="false"
				autocomplete="off"
			/>
		</label>

		<label class="block sm:w-24" for="nodes">
			<span class="label mb-1.5 block">Nodes</span>
			<select id="nodes" bind:value={maxNodes} class="field px-2!">
				{#each [3, 5, 6, 8, 10] as count (count)}
					<option value={count}>{count}</option>
				{/each}
			</select>
		</label>

		<button type="submit" class="btn btn-primary h-9 px-3.5" disabled={status === 'running'}>
			{status === 'running' ? 'Checking…' : 'Run check'}
		</button>
	</div>

	<div
		class="mt-4 flex flex-col gap-2 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between"
	>
		<div class="inline-flex overflow-hidden rounded-md border border-line">
			{#each TYPES as option, i (option.id)}
				<button
					type="button"
					class="h-7 px-2.5 text-[11.5px] transition-colors duration-150 {type === option.id
						? 'bg-raised text-fg'
						: 'text-mut hover:text-fg'} {i > 0 ? 'border-l border-line' : ''}"
					aria-pressed={type === option.id}
					onclick={() => (type = option.id)}
				>
					{option.label}
				</button>
			{/each}
		</div>
		<span class="text-[11.5px] text-dim">{selectedType.hint}</span>
	</div>
</form>

{#if errorMessage}
	<p class="mt-3 text-[12px] leading-relaxed text-err">{errorMessage}</p>
{/if}

<div class="mt-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-2.5">
	<div class="flex items-baseline gap-3">
		<h2 class="text-[13px] font-medium">Results</h2>
		{#if status === 'idle'}
			<span class="text-[11.5px] text-dim">Nothing checked yet</span>
		{:else if status === 'running' || counts.pending > 0}
			<span class="flex items-center gap-1.5 text-[11.5px] text-dim">
				<svg class="h-3 w-3 animate-spin" viewBox="0 0 12 12" aria-hidden="true">
					<circle
						cx="6"
						cy="6"
						r="4.5"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						opacity="0.25"
					/>
					<path
						d="M6 1.5A4.5 4.5 0 0 1 10.5 6"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
					/>
				</svg>
				{counts.ok + counts.fail} of {rows.length} reported
			</span>
		{:else}
			<span class="text-[11.5px] text-mut">
				{counts.ok} ok · {counts.fail} failed
			</span>
		{/if}
	</div>

	{#if permanentLink}
		<a
			class="text-[11.5px] text-dim transition-colors hover:text-fg"
			href={permanentLink}
			target="_blank"
			rel="noreferrer"
		>
			Permanent report
		</a>
	{/if}
</div>

<div class="mt-1">
	{#if rows.length === 0}
		<p class="py-10 text-[12.5px] text-dim">
			{#if status === 'running'}
				Asking {maxNodes} nodes for a result…
			{:else}
				Enter a host and run a check. Rows appear as each node reports back.
			{/if}
		</p>
	{:else}
		<NodeResultsTable {rows} showLatency={type !== 'dns'} />
	{/if}
</div>

<p class="mt-4 text-[11px] leading-relaxed text-dim">
	One check every few seconds per address, because check-host.net is a free service with strict rate
	limits. DNS results have no latency column.
</p>
