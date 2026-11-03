<script lang="ts">
	import type { AstNode } from '#lib/tools/parsers/types';
	import { untrack } from 'svelte';
	import AstBranch from './AstBranch.svelte';

	interface Props {
		node: AstNode;
		depth?: number;
		defaultOpen?: number;
		selected?: AstNode | null;
		onselect?: (node: AstNode) => void;
	}

	let { node, depth = 0, defaultOpen = 2, selected = null, onselect }: Props = $props();

	let open = $state(untrack(() => depth < defaultOpen));
	let showAll = $state(false);

	const children = $derived(node.children ?? []);
	const shown = $derived(showAll ? children : children.slice(0, 80));
	const hasKids = $derived(children.length > 0);
	const isSelected = $derived(selected === node);
</script>

<div>
	<div class="flex items-start gap-1 rounded-[3px] pr-1" class:bg-raised={isSelected}>
		<button
			type="button"
			class="mt-0.75 flex h-3.5 w-3.5 shrink-0 items-center justify-center text-[#4d5155] transition-colors hover:text-fg"
			class:invisible={!hasKids}
			aria-label={open ? 'Collapse node' : 'Expand node'}
			onclick={() => (open = !open)}
		>
			<svg width="9" height="9" viewBox="0 0 10 10" class:rotate-90={open} aria-hidden="true">
				<path
					d="M3.5 1.5 7 5 3.5 8.5"
					fill="none"
					stroke="currentColor"
					stroke-width="1.3"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</button>

		<button
			type="button"
			class="min-w-0 flex-1 cursor-pointer py-px text-left font-mono text-[11.5px] leading-[1.55]"
			onclick={() => {
				onselect?.(node);
				if (hasKids) open = !open;
			}}
		>
			<span class="text-[#c9cbc9]" class:text-accent={isSelected}>{node.label}</span>
			{#if node.detail}
				<span class="ml-1.5 break-all text-dim">{node.detail}</span>
			{/if}
			{#if hasKids}
				<span class="ml-1.5 text-[9.5px] text-[#4d5155]">{children.length}</span>
			{/if}
		</button>
	</div>

	{#if open && hasKids}
		<div class="ml-1.5 border-l border-line pl-2.5">
			{#each shown as child, i (i)}
				<AstBranch node={child} depth={depth + 1} {defaultOpen} {selected} {onselect} />
			{/each}
			{#if !showAll && children.length > 80}
				<button
					type="button"
					class="my-1 text-[10.5px] text-dim transition-colors hover:text-fg"
					onclick={() => (showAll = true)}
				>
					Show {children.length - 80} more
				</button>
			{/if}
		</div>
	{/if}
</div>
