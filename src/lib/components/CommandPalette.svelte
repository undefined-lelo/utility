<script lang="ts">
	import { goto } from '$app/navigation';
	import { TOOLS } from '#lib/tools/registry';

	interface Props {
		open?: boolean;
	}

	let { open = $bindable(false) }: Props = $props();

	let query = $state('');
	let active = $state(0);
	let input = $state<HTMLInputElement | null>(null);

	const rowBase =
		'flex w-full items-center gap-3 rounded-[5px] px-2 py-1.5 text-left transition-colors duration-150';

	const results = $derived.by(() => {
		const term = query.trim().toLowerCase();
		if (!term) return TOOLS;
		return TOOLS.filter((tool) =>
			[tool.name, tool.blurb, tool.href, ...tool.keys].join(' ').toLowerCase().includes(term)
		);
	});

	$effect(() => {
		if (!open) return;
		query = '';
		active = 0;
		const frame = requestAnimationFrame(() => input?.focus());
		return () => cancelAnimationFrame(frame);
	});

	$effect(() => {
		if (active > results.length - 1) active = Math.max(0, results.length - 1);
	});

	function go(index: number) {
		const tool = results[index];
		if (!tool) return;
		open = false;
		goto(tool.href);
	}

	function onkeydown(event: KeyboardEvent) {
		const count = results.length;
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			if (count) active = (active + 1) % count;
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			if (count) active = (active - 1 + count) % count;
		} else if (event.key === 'Enter') {
			event.preventDefault();
			go(active);
		} else if (event.key === 'Escape') {
			event.preventDefault();
			open = false;
		}
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[14vh]"
		role="dialog"
		aria-modal="true"
		aria-label="Search tools"
	>
		<button
			type="button"
			class="absolute inset-0 cursor-default bg-bg/85"
			aria-label="Close search"
			onclick={() => (open = false)}
		></button>

		<div
			class="relative w-full max-w-md overflow-hidden rounded-[10px] border border-line-strong bg-surface shadow-[0_18px_50px_-14px_rgba(0,0,0,0.85)]"
		>
			<div class="flex items-center gap-2.5 border-b border-line px-3">
				<svg
					width="13"
					height="13"
					viewBox="0 0 14 14"
					class="shrink-0 text-dim"
					aria-hidden="true"
				>
					<circle cx="6" cy="6" r="4.3" fill="none" stroke="currentColor" stroke-width="1.3" />
					<path d="m9.3 9.3 3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
				</svg>
				<input
					bind:this={input}
					bind:value={query}
					{onkeydown}
					placeholder="Search tools"
					class="w-full bg-transparent py-2.5 text-[13px] text-fg outline-none placeholder:text-dim"
					aria-label="Search tools"
				/>
				<kbd class="kbd">Esc</kbd>
			</div>

			<ul class="max-h-[46vh] overflow-auto p-1.5" role="listbox" aria-label="Tools">
				{#each results as tool, i (tool.id)}
					<li>
						<button
							type="button"
							role="option"
							aria-selected={i === active}
							class={i === active ? rowBase + ' bg-raised' : rowBase}
							onmouseenter={() => (active = i)}
							onclick={() => go(i)}
						>
							<span
								class={i === active
									? 'truncate text-[12.5px] text-fg'
									: 'truncate text-[12.5px] text-mut'}
							>
								{tool.name}
							</span>
							<span class="ml-auto shrink-0 font-mono text-[10.5px] text-dim">
								{tool.client ? '' : 'server'}
							</span>
						</button>
					</li>
				{/each}

				{#if results.length === 0}
					<li class="px-2 py-6 text-center text-[12px] text-dim">No matches</li>
				{/if}
			</ul>

			<div
				class="flex items-center justify-between border-t border-line px-3 py-2 text-[10.5px] text-dim"
			>
				<span>{results.length} of {TOOLS.length}</span>
				<span class="flex items-center gap-1.5">
					<kbd class="kbd">↑</kbd><kbd class="kbd">↓</kbd> to move
					<kbd class="kbd">↵</kbd> to open
				</span>
			</div>
		</div>
	</div>
{/if}
