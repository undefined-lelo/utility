<script lang="ts">
	import { onMount } from 'svelte';
	import CopyButton from '#lib/components/CopyButton.svelte';
	import { osmLink, type GeoResponse, type IpGeo } from '#lib/tools/ip';

	let target = $state('');
	let phase = $state<'idle' | 'loading' | 'ready' | 'error'>('idle');
	let geo = $state<IpGeo | null>(null);
	let resolved = $state<string | null>(null);
	let note = $state('');
	let errorMessage = $state('');
	let cached = $state(false);
	let showRaw = $state(false);

	const FIELDS: { key: keyof IpGeo; label: string }[] = [
		{ key: 'query', label: 'Query' },
		{ key: 'continent', label: 'Continent' },
		{ key: 'continentCode', label: 'Continent code' },
		{ key: 'country', label: 'Country' },
		{ key: 'countryCode', label: 'Country code' },
		{ key: 'region', label: 'Region code' },
		{ key: 'regionName', label: 'Region' },
		{ key: 'city', label: 'City' },
		{ key: 'district', label: 'District' },
		{ key: 'zip', label: 'Postal code' },
		{ key: 'lat', label: 'Latitude' },
		{ key: 'lon', label: 'Longitude' },
		{ key: 'timezone', label: 'Time zone' },
		{ key: 'offset', label: 'UTC offset' },
		{ key: 'currency', label: 'Currency' },
		{ key: 'isp', label: 'ISP' },
		{ key: 'org', label: 'Organisation' },
		{ key: 'as', label: 'ASN' },
		{ key: 'asname', label: 'AS name' },
		{ key: 'reverse', label: 'Reverse DNS' },
		{ key: 'mobile', label: 'Mobile' },
		{ key: 'proxy', label: 'Proxy' },
		{ key: 'hosting', label: 'Hosting' },
		{ key: 'message', label: 'Message' }
	];

	const entries = $derived.by(() => {
		if (!geo) return [];
		return FIELDS.flatMap(({ key, label }) => {
			const value = geo?.[key];
			if (value === undefined || value === null || value === '') return [];
			const shown = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
			return [{ label, value: shown }];
		});
	});

	async function lookup(query?: string) {
		const value = query?.trim();
		if (value === '') return;

		phase = 'loading';
		errorMessage = '';
		note = '';
		showRaw = false;

		try {
			const res = await fetch(value ? `/api/ip/${encodeURIComponent(value)}` : '/api/ip', {
				headers: { accept: 'application/json' }
			});
			const data = (await res.json()) as GeoResponse;

			resolved = data.query ?? value ?? null;
			cached = data.cached ?? false;

			if (!res.ok || data.error) {
				phase = 'error';
				errorMessage = data.error ?? `Lookup failed (${res.status}).`;
				geo = null;
				return;
			}

			geo = data.geo ?? null;
			note = data.note ?? '';
			phase = geo ? 'ready' : 'error';
			if (!geo && !note) errorMessage = 'ip-api.com returned no data for that query.';
		} catch {
			phase = 'error';
			errorMessage = 'Could not reach the lookup proxy.';
		}
	}

	onMount(() => {
		lookup();
	});

	const mapsUrl = $derived(
		geo?.lat !== undefined && geo?.lon !== undefined ? osmLink(geo.lat, geo.lon) : null
	);
</script>

<svelte:head>
	<title>IP Lookup · utility</title>
</svelte:head>

<header class="mb-8">
	<p class="label">Network</p>
	<h1 class="mt-1 text-[24px] font-medium tracking-[-0.01em]">IP Lookup</h1>
	<p class="mt-2 max-w-[62ch] text-[13px] leading-relaxed text-mut">
		Every field <span class="num text-fg">ip-api.com</span> returns for an address or domain. Results
		are cached for ten minutes and the free endpoint allows 45 lookups a minute.
	</p>
</header>

<div class="grid gap-6 lg:grid-cols-[280px_1fr]">
	<section>
		<label class="label mb-1.5 block" for="ip">Address or domain</label>
		<form
			class="flex gap-2"
			onsubmit={(event) => {
				event.preventDefault();
				lookup(target);
			}}
		>
			<input
				id="ip"
				bind:value={target}
				placeholder="8.8.8.8"
				class="field"
				spellcheck="false"
				autocomplete="off"
			/>
			<button type="submit" class="btn" disabled={phase === 'loading'}>Look up</button>
		</form>

		<div class="mt-3 flex flex-wrap gap-1.5">
			<button
				type="button"
				class="rounded-sm border border-line px-1.5 py-0.5 text-[11px] text-mut transition-colors hover:border-line-strong hover:text-fg"
				onclick={() => {
					target = '';
					lookup();
				}}>My address</button
			>
			{#each ['1.1.1.1', '8.8.8.8', '9.9.9.9', 'example.com'] as sample (sample)}
				<button
					type="button"
					class="rounded-sm border border-line px-1.5 py-0.5 text-[11px] text-mut transition-colors hover:border-line-strong hover:text-fg"
					onclick={() => {
						target = sample;
						lookup(sample);
					}}>{sample}</button
				>
			{/each}
		</div>

		<dl class="mt-6 space-y-3 border-t border-line pt-4">
			<div class="flex items-baseline justify-between gap-3">
				<dt class="text-[11.5px] text-dim">Resolved</dt>
				<dd class="num text-[12.5px] text-fg">{resolved ?? '—'}</dd>
			</div>
			<div class="flex items-baseline justify-between gap-3">
				<dt class="text-[11.5px] text-dim">Status</dt>
				<dd
					class="text-[12.5px]"
					class:text-err={phase === 'error'}
					class:text-mut={phase !== 'error'}
				>
					{phase === 'loading'
						? 'Looking up'
						: phase === 'ready'
							? cached
								? 'Cached'
								: 'Live'
							: phase === 'error'
								? 'Failed'
								: 'Idle'}
				</dd>
			</div>
			{#if geo?.country}
				<div class="flex items-baseline justify-between gap-3">
					<dt class="text-[11.5px] text-dim">Country</dt>
					<dd class="text-[12.5px] text-fg">{geo.country} ({geo.countryCode})</dd>
				</div>
			{/if}
		</dl>

		{#if note}
			<p class="mt-4 text-[11.5px] leading-relaxed text-warn">{note}</p>
		{/if}
		{#if errorMessage}
			<p class="mt-4 text-[11.5px] leading-relaxed text-err">{errorMessage}</p>
		{/if}
	</section>

	<section class="panel overflow-hidden">
		<div class="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
			<h2 class="text-[12px] font-medium text-mut">Response</h2>
			<div class="flex items-center gap-2">
				{#if mapsUrl}
					<a
						class="text-[11.5px] text-dim transition-colors hover:text-fg"
						href={mapsUrl}
						target="_blank"
						rel="noreferrer">Open map</a
					>
				{/if}
				{#if geo}
					<button
						type="button"
						class="text-[11.5px] text-dim transition-colors hover:text-fg"
						onclick={() => (showRaw = !showRaw)}>{showRaw ? 'Table' : 'JSON'}</button
					>
					<CopyButton value={JSON.stringify(geo, null, 2)}>Copy</CopyButton>
				{/if}
			</div>
		</div>

		{#if !geo}
			<div class="px-4 py-10">
				<p class="text-[12.5px] text-dim">
					{#if phase === 'loading'}
						Looking up {target || 'your address'}…
					{:else}
						Enter an address or domain to see its full ip-api response.
					{/if}
				</p>
			</div>
		{:else if showRaw}
			<pre
				class="max-h-112 overflow-auto p-4 font-mono text-[11.5px] leading-relaxed text-mut">{JSON.stringify(
					geo,
					null,
					2
				)}</pre>
		{:else}
			<dl class="grid grid-cols-1 sm:grid-cols-2">
				{#each entries as entry (entry.label)}
					<div class="border-b border-line px-4 py-2.5 sm:odd:border-r">
						<dt class="text-[11px] text-dim">{entry.label}</dt>
						<dd class="mt-0.5 text-[12.5px] wrap-break-word text-fg">{entry.value}</dd>
					</div>
				{/each}
			</dl>
			<div class="px-4 py-2.5">
				<p class="text-[11px] text-dim">
					{entries.length} fields returned by ip-api.com{geo.reverse === undefined
						? ' · reverse DNS needs a paid plan'
						: ''}
				</p>
			</div>
		{/if}
	</section>
</div>
