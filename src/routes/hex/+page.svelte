<script lang="ts">
	import CopyButton from '#lib/components/CopyButton.svelte';
	import { decimalToBases, type BitWidth } from '#lib/tools/numbers';

	let input = $state('255');
	let width = $state<BitWidth>('auto');

	const result = $derived(decimalToBases(input, width));

	const widths: { value: BitWidth; label: string }[] = [
		{ value: 'auto', label: 'Auto' },
		{ value: 8, label: '8' },
		{ value: 16, label: '16' },
		{ value: 32, label: '32' },
		{ value: 64, label: '64' }
	];

	const examples = ['255', '1024', '65535', '4294967295', '3735928559', '-1'];

	const rows = $derived.by(() => {
		if (!result.ok) return [];
		return [
			{ label: 'Hexadecimal', value: result.hex },
			{ label: 'Binary', value: result.binary },
			{ label: 'Octal', value: result.octal },
			{ label: 'Decimal (unsigned)', value: result.decimal }
		];
	});
</script>

<svelte:head>
	<title>Decimal to hex · utility</title>
</svelte:head>

<header class="mb-8">
	<p class="label">Convert</p>
	<h1 class="mt-1 text-[24px] font-medium tracking-[-0.01em]">Decimal → Hex</h1>
	<p class="mt-2 max-w-[62ch] text-[13px] leading-relaxed text-mut">
		Type a decimal integer to see its hexadecimal, binary and octal forms. A fixed width pads the
		result and turns negative numbers into two’s complement.
	</p>
</header>

<div class="grid gap-8 lg:grid-cols-[minmax(0,380px)_1fr]">
	<section>
		<label class="label mb-1.5 block" for="decimal">Decimal</label>
		<input
			id="decimal"
			bind:value={input}
			placeholder="255"
			class="field h-11 font-mono text-[16px]"
			spellcheck="false"
			autocomplete="off"
			inputmode="numeric"
		/>

		<div class="mt-5">
			<span class="label mb-1.5 block">Bit width</span>
			<div class="inline-flex overflow-hidden rounded-md border border-line">
				{#each widths as option, i (option.value)}
					<button
						type="button"
						class="h-8 px-3 text-[12px] transition-colors duration-150 {width === option.value
							? 'bg-raised text-fg'
							: 'text-mut hover:text-fg'} {i > 0 ? 'border-l border-line' : ''}"
						aria-pressed={width === option.value}
						onclick={() => (width = option.value)}
					>
						{option.label}
					</button>
				{/each}
			</div>
		</div>

		<div class="mt-5">
			<span class="label mb-1.5 block">Examples</span>
			<div class="flex flex-wrap gap-1.5">
				{#each examples as example (example)}
					<button
						type="button"
						class="rounded-sm border border-line px-1.5 py-0.5 font-mono text-[11px] text-mut transition-colors duration-150 hover:border-line-strong hover:text-fg"
						onclick={() => (input = example)}>{example}</button
					>
				{/each}
			</div>
		</div>

		{#if !result.ok}
			<p class="mt-6 text-[12px] leading-relaxed text-err">{result.error}</p>
		{:else if result.twoComplement}
			<p class="mt-6 text-[12px] leading-relaxed text-warn">
				Negative input, shown as {result.usedWidth}-bit two’s complement.
			</p>
		{/if}
	</section>

	<section class="min-w-0">
		<div class="flex items-baseline justify-between gap-4 border-b border-line pb-3">
			<span class="label">Hexadecimal</span>
			{#if result.ok}<CopyButton value={result.hex}>Copy</CopyButton>{/if}
		</div>

		<div class="pt-4">
			{#if result.ok}
				<p
					class="font-mono text-[30px] leading-tight tracking-[-0.01em] break-all text-fg sm:text-[36px]"
				>
					{result.hex}
				</p>
				<p class="mt-2 text-[11.5px] text-dim">
					{result.usedWidth}-bit · {result.hexBytes.length} bytes
				</p>

				<div
					class="mt-6 flex flex-wrap gap-x-3 gap-y-1 border-t border-line pt-4 font-mono text-[12.5px] text-mut"
				>
					{#each result.hexBytes as byte, i (i)}
						<span>{byte}</span>
					{/each}
				</div>

				<dl class="mt-6 border-t border-line">
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
			{:else}
				<p class="font-mono text-[30px] text-[#4d5155]">—</p>
			{/if}
		</div>
	</section>
</div>
