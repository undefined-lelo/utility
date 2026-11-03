<script lang="ts">
	import type { Tool } from '#lib/tools/registry';

	let { tool }: { tool: Tool } = $props();
</script>

<a
	href={tool.href}
	class="-mx-2 flex flex-col gap-1 rounded-md border-b border-line px-2 py-3 transition-colors duration-150 hover:bg-surface sm:flex-row sm:items-baseline sm:gap-6"
>
	<span class="shrink-0 text-[13px] font-medium text-fg sm:w-43">{tool.name}</span>
	<span class="min-w-0 flex-1 text-[12.5px] leading-relaxed text-mut">{tool.blurb}</span>
	<span class="shrink-0 text-[11px] text-dim sm:w-13 sm:text-right">
		{tool.client ? '' : 'server'}
	</span>
</a>
