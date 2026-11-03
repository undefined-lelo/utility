<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
		value: string;
		label?: string;
	}

	let { children, value, label = 'Copy' }: Props = $props();

	let state = $state<'idle' | 'done' | 'failed'>('idle');
	let timer: ReturnType<typeof setTimeout> | undefined;

	async function copy() {
		try {
			await navigator.clipboard.writeText(value);
			state = 'done';
		} catch {
			state = 'failed';
		}
		clearTimeout(timer);
		timer = setTimeout(() => (state = 'idle'), 1400);
	}
</script>

<button
	type="button"
	class="inline-flex h-6 items-center gap-1.5 rounded-sm px-1.5 text-[11.5px] text-dim transition-colors duration-150 hover:bg-raised hover:text-fg"
	onclick={copy}
	title="Copy to clipboard"
>
	{#if state === 'done'}
		<svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"
			><path
				d="M1.75 6.25 4.5 9 10.25 2.75"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/></svg
		>
		<span class="text-ok">Copied</span>
	{:else if state === 'failed'}
		<span class="text-err">Copy failed</span>
	{:else}
		<svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
			<rect
				x="4.25"
				y="4.25"
				width="6"
				height="6"
				rx="1"
				fill="none"
				stroke="currentColor"
				stroke-width="1.2"
			/>
			<path
				d="M8 2.75V2.5a1 1 0 0 0-1-1H2.5a1 1 0 0 0-1 1v4.5a1 1 0 0 0 1 1h.25"
				fill="none"
				stroke="currentColor"
				stroke-width="1.2"
			/>
		</svg>
		{#if children}{@render children()}{:else}{label}{/if}
	{/if}
</button>
