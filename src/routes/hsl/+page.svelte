<script lang="ts">
	import CopyButton from '#lib/components/CopyButton.svelte';
	import {
		hslToCss,
		hslToHex,
		hslToRgb,
		isLight,
		parseColor,
		rgbToCss,
		type Hsl
	} from '#lib/tools/color';

	let h = $state(88);
	let s = $state(85);
	let l = $state(63);
	let a = $state(1);

	const rgb = $derived(hslToRgb({ h, s, l, a } as Hsl));
	const hex = $derived(hslToHex({ h, s, l, a }));
	const css = $derived(hslToCss({ h, s, l, a }));
	const rgbCss = $derived(rgbToCss(rgb, a));
	const light = $derived(isLight(rgb));

	let draft = $state('');
	let draftError = $state('');

	const satTrack = $derived(
		`linear-gradient(to right, ${hslToHex({ h, s: 0, l, a: 1 })}, ${hslToHex({ h, s: 100, l, a: 1 })})`
	);
	const lightTrack = $derived(
		`linear-gradient(to right, #000, ${hslToHex({ h, s, l: 50, a: 1 })}, #fff)`
	);

	function applyDraft() {
		const parsed = parseColor(draft);
		if (!parsed) {
			draftError = 'Not a colour: try #c9f75a, rgb(201 247 90) or hsl(88 85% 63%).';
			return;
		}
		draftError = '';
		h = Math.round(parsed.h);
		s = Math.round(parsed.s);
		l = Math.round(parsed.l);
		a = parsed.a;
		draft = '';
	}

	const presets = [
		{ name: 'Lime', value: { h: 88, s: 85, l: 63, a: 1 } },
		{ name: 'Signal', value: { h: 9, s: 96, l: 60, a: 1 } },
		{ name: 'Ice', value: { h: 190, s: 90, l: 62, a: 1 } },
		{ name: 'Moss', value: { h: 140, s: 30, l: 42, a: 1 } },
		{ name: 'Ink', value: { h: 200, s: 12, l: 12, a: 1 } }
	];

	const rows = $derived([
		{ label: 'Hex', value: hex },
		{ label: 'RGB', value: rgbCss },
		{ label: 'HSL', value: css },
		{ label: 'Custom property', value: `--accent: ${hex};` }
	]);
</script>

<svelte:head>
	<title>HSL to hex · utility</title>
</svelte:head>

<header class="mb-8">
	<p class="label">Convert</p>
	<h1 class="mt-1 text-[24px] font-medium tracking-[-0.01em]">HSL → Hex</h1>
	<p class="mt-2 max-w-[62ch] text-[13px] leading-relaxed text-mut">
		Set hue, saturation and lightness. Alpha below 100% produces an eight-digit
		<span class="font-mono text-fg">#RRGGBBAA</span> value, which CSS accepts.
	</p>
</header>

<div class="grid gap-8 lg:grid-cols-[1fr_minmax(0,360px)]">
	<section class="flex flex-col gap-5">
		<div
			class="flex h-48 items-end rounded-[10px] border border-line p-5"
			style="background-color: {hex}"
		>
			<div class="flex w-full items-end justify-between gap-4">
				<span
					class="font-mono text-[22px] tracking-[-0.01em] {light
						? 'text-black/85'
						: 'text-white/90'}"
				>
					{hex}
				</span>
				<span class="font-mono text-[11px] {light ? 'text-black/55' : 'text-white/55'}">
					{Math.round(a * 100)}% opacity
				</span>
			</div>
		</div>

		<div class="flex flex-col gap-4">
			<label class="block">
				<span class="mb-1.5 flex items-baseline justify-between">
					<span class="label">Hue</span>
					<span class="font-mono text-[11.5px] text-mut tabular-nums">{h}°</span>
				</span>
				<input
					class="slider"
					type="range"
					min="0"
					max="360"
					step="1"
					bind:value={h}
					style="background: linear-gradient(to right, #f00, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00)"
					aria-label="Hue"
				/>
			</label>

			<label class="block">
				<span class="mb-1.5 flex items-baseline justify-between">
					<span class="label">Saturation</span>
					<span class="font-mono text-[11.5px] text-mut tabular-nums">{s}%</span>
				</span>
				<input
					class="slider"
					type="range"
					min="0"
					max="100"
					step="1"
					bind:value={s}
					style="background: {satTrack}"
					aria-label="Saturation"
				/>
			</label>

			<label class="block">
				<span class="mb-1.5 flex items-baseline justify-between">
					<span class="label">Lightness</span>
					<span class="font-mono text-[11.5px] text-mut tabular-nums">{l}%</span>
				</span>
				<input
					class="slider"
					type="range"
					min="0"
					max="100"
					step="1"
					bind:value={l}
					style="background: {lightTrack}"
					aria-label="Lightness"
				/>
			</label>

			<label class="block">
				<span class="mb-1.5 flex items-baseline justify-between">
					<span class="label">Alpha</span>
					<span class="font-mono text-[11.5px] text-mut tabular-nums">{Math.round(a * 100)}%</span>
				</span>
				<input
					class="slider"
					type="range"
					min="0"
					max="1"
					step="0.01"
					bind:value={a}
					style="background: linear-gradient(to right, transparent, {hex})"
					aria-label="Alpha"
				/>
			</label>
		</div>

		<div class="flex flex-wrap gap-1.5">
			{#each presets as preset (preset.name)}
				<button
					type="button"
					class="rounded-[4px] border border-line px-1.5 py-0.5 text-[11px] text-mut transition-colors duration-150 hover:border-line-strong hover:text-fg"
					onclick={() => {
						h = preset.value.h;
						s = preset.value.s;
						l = preset.value.l;
						a = preset.value.a;
					}}>{preset.name}</button
				>
			{/each}
		</div>
	</section>

	<section class="min-w-0">
		<div class="flex items-baseline justify-between gap-4 border-b border-line pb-3">
			<span class="label">Values</span>
			<span class="font-mono text-[11px] text-dim">
				{rgb.r}
				{rgb.g}
				{rgb.b}
			</span>
		</div>

		<dl class="mb-6">
			{#each rows as row (row.label)}
				<div class="flex items-center justify-between gap-4 border-b border-line py-2.5">
					<dt class="shrink-0 text-[11.5px] text-dim">{row.label}</dt>
					<dd class="flex min-w-0 items-center gap-2">
						<span class="truncate font-mono text-[12.5px] text-fg">{row.value}</span>
						<CopyButton value={row.value} />
					</dd>
				</div>
			{/each}
		</dl>

		<label class="label mb-1.5 block" for="draft">Load a colour</label>
		<form
			class="flex gap-2"
			onsubmit={(event) => {
				event.preventDefault();
				applyDraft();
			}}
		>
			<input
				id="draft"
				bind:value={draft}
				placeholder="#c9f75a"
				class="field"
				spellcheck="false"
				autocomplete="off"
			/>
			<button type="submit" class="btn">Load</button>
		</form>
		{#if draftError}
			<p class="mt-2 text-[11.5px] leading-relaxed text-err">{draftError}</p>
		{:else}
			<p class="mt-2 text-[11px] text-dim">Accepts hex, rgb() and hsl().</p>
		{/if}
	</section>
</div>

<style>
	.slider {
		width: 100%;
		height: 8px;
		appearance: none;
		-webkit-appearance: none;
		border: 1px solid var(--color-line);
		border-radius: 4px;
		cursor: pointer;
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: #fff;
		border: 1px solid rgb(0 0 0 / 0.35);
	}

	.slider::-moz-range-thumb {
		width: 13px;
		height: 13px;
		border-radius: 50%;
		background: #fff;
		border: 1px solid rgb(0 0 0 / 0.35);
	}
</style>
