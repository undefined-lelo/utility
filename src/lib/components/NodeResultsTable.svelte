<script lang="ts">
	import type { CheckRow } from '#lib/tools/checkhost';

	interface Props {
		rows: CheckRow[];
		showLatency?: boolean;
	}

	let { rows, showLatency = true }: Props = $props();

	const stateLabel: Record<CheckRow['state'], string> = {
		ok: 'ok',
		fail: 'failed',
		pending: 'pending'
	};
</script>

<div class="overflow-x-auto">
	<table class="w-full border-collapse text-left">
		<thead>
			<tr class="border-b border-line">
				<th class="pr-4 pb-2 text-[11px] font-medium text-dim">Node</th>
				<th class="pr-4 pb-2 text-[11px] font-medium text-dim">Location</th>
				<th class="pr-4 pb-2 text-[11px] font-medium text-dim">ASN</th>
				{#if showLatency}
					<th class="pr-4 pb-2 text-right text-[11px] font-medium text-dim">Time</th>
				{/if}
				<th class="pr-4 pb-2 text-[11px] font-medium text-dim">Result</th>
				<th class="pb-2 text-[11px] font-medium text-dim">State</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as row (row.id)}
				<tr class="border-b border-line last:border-0">
					<td class="py-2.5 pr-4 font-mono text-[11.5px] whitespace-nowrap text-mut">
						{row.id.split('.')[0]}
					</td>
					<td class="py-2.5 pr-4 text-[12.5px] whitespace-nowrap text-fg">
						{row.country}
						<span class="ml-1.5 text-dim">{row.city}</span>
					</td>
					<td class="py-2.5 pr-4 font-mono text-[11.5px] whitespace-nowrap text-dim">{row.asn}</td>
					{#if showLatency}
						<td
							class="py-2.5 pr-4 text-right font-mono text-[11.5px] whitespace-nowrap text-mut tabular-nums"
						>
							{row.latency !== undefined ? `${row.latency}s` : '—'}
						</td>
					{/if}
					<td class="py-2.5 pr-4 text-[12.5px]">
						<span class="text-fg">{row.summary}</span>
						{#if row.detail}
							<span class="mt-0.5 block font-mono text-[10.5px] text-dim">{row.detail}</span>
						{/if}
					</td>
					<td class="py-2.5 whitespace-nowrap">
						<span class="inline-flex items-center gap-1.5 text-[11.5px]">
							<span
								class="h-1.5 w-1.5 rounded-full"
								class:bg-ok={row.state === 'ok'}
								class:bg-err={row.state === 'fail'}
								class:bg-warn={row.state === 'pending'}
							></span>
							<span
								class:text-mut={row.state === 'ok'}
								class:text-err={row.state === 'fail'}
								class:text-warn={row.state === 'pending'}>{stateLabel[row.state]}</span
							>
						</span>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
