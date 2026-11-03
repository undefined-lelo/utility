<script lang="ts">
	import type { AstNode } from '#lib/tools/parsers/types';
	import AstBranch from './AstBranch.svelte';

	interface Props {
		nodes: AstNode[];
		selected?: AstNode | null;
		onselect?: (node: AstNode) => void;
		truncated?: boolean;
	}

	let { nodes, selected = null, onselect, truncated = false }: Props = $props();

	let generation = $state(0);
	let defaultOpen = $state(2);

	function setDepth(next: number) {
		defaultOpen = next;
		generation++;
	}
</script>

<div class="flex h-full min-h-0 flex-col">
	<div class="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
		<h2 class="text-[12px] font-medium text-mut">Syntax tree</h2>
		<div class="flex items-center gap-3">
			<button
				type="button"
				class="text-[11.5px] text-dim transition-colors hover:text-fg"
				onclick={() => setDepth(0)}>Collapse</button
			>
			<button
				type="button"
				class="text-[11.5px] text-dim transition-colors hover:text-fg"
				onclick={() => setDepth(99)}>Expand</button
			>
		</div>
	</div>

	<div class="min-h-0 flex-1 overflow-auto p-2">
		{#if nodes.length === 0}
			<p class="px-2 py-6 text-[12px] text-dim">No tree yet. Start typing in the editor.</p>
		{:else}
			{#key generation}
				{#each nodes as node, i (i)}
					<AstBranch {node} depth={0} {defaultOpen} {selected} {onselect} />
				{/each}
			{/key}
		{/if}
		{#if truncated}
			<p class="mt-2 px-2 text-[11px] text-warn">
				Viewer limit reached. This file produced more nodes than are shown.
			</p>
		{/if}
	</div>
</div>
