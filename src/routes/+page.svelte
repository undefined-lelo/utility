<script lang="ts">
	import ToolRow from '#lib/components/ToolRow.svelte';
	import { GROUPS, toolsByGroup } from '#lib/tools/registry';
</script>

<section class="grid gap-10 pb-12 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:gap-14">
	<div>
		<p class="text-[12px] text-dim">Nine tools, no account, nothing stored</p>
		<h1
			class="mt-3 max-w-[19ch] text-[32px] leading-[1.08] font-medium tracking-[-0.02em] sm:text-[40px]"
		>
			A toolbox for numbers, source code and hosts
		</h1>
		<p class="mt-4 max-w-[52ch] text-[13.5px] leading-relaxed text-mut">
			Convert bases and colours, parse JavaScript, Python, Rust, CSS or JSON into a syntax tree,
			look up an address, or check a site from nodes around the world.
		</p>
		<div class="mt-6 flex flex-wrap items-center gap-2.5">
			<a class="btn btn-primary px-3" href="#convert">Browse the tools</a>
			<a class="btn btn-quiet" href="/parse/json">Open the JSON parser</a>
		</div>
	</div>

	<div class="panel overflow-hidden">
		<div class="flex items-center justify-between border-b border-line px-4 py-2.5">
			<span class="text-[11.5px] text-dim">Output</span>
			<span class="text-[11px] text-dim">4 of 9 tools</span>
		</div>

		<div class="divide-y divide-line">
			<div class="flex items-baseline justify-between gap-4 px-4 py-3">
				<span class="text-[12px] text-mut">Decimal → Hex</span>
				<span class="num text-[13px] text-fg">0xFF</span>
			</div>

			<div class="flex items-center justify-between gap-4 px-4 py-3">
				<span class="text-[12px] text-mut">HSL → Hex</span>
				<span class="flex items-center gap-2.5">
					<span class="h-5 w-5 rounded-sm bg-accent" aria-hidden="true"></span>
					<span class="num text-[13px] text-fg">#D8A13F</span>
				</span>
			</div>

			<div class="flex items-baseline justify-between gap-4 px-4 py-3">
				<span class="text-[12px] text-mut">IP Lookup</span>
				<span class="text-right">
					<span class="num block text-[13px] text-fg">AS15169 · Google LLC</span>
					<span class="block text-[11px] text-dim">Ashburn, US</span>
				</span>
			</div>

			<div class="flex items-baseline justify-between gap-4 px-4 py-3">
				<span class="text-[12px] text-mut">Site Checker</span>
				<span class="text-right">
					<span class="num block text-[13px] text-fg">6 of 6 responded</span>
					<span class="block text-[11px] text-dim">median 0.14 s</span>
				</span>
			</div>
		</div>
	</div>
</section>

{#each GROUPS as group (group.id)}
	<section id={group.id} class="scroll-mt-20 pb-10">
		<div class="flex items-baseline justify-between border-b border-line pb-2.5">
			<h2 class="text-[13px] font-medium">{group.label}</h2>
			<span class="text-[11.5px] text-dim">{toolsByGroup(group.id).length} tools</span>
		</div>

		<div>
			{#each toolsByGroup(group.id) as tool (tool.id)}
				<ToolRow {tool} />
			{/each}
		</div>
	</section>
{/each}
