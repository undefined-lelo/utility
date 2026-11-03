<script lang="ts">
	interface Props {
		value: string;
		placeholder?: string;
		errorLine?: number | null;
		readonly?: boolean;
		minHeight?: string;
		ariaLabel?: string;
	}

	let {
		value = $bindable(''),
		placeholder = '',
		errorLine = null,
		readonly = false,
		minHeight = '24rem',
		ariaLabel = 'Source code'
	}: Props = $props();

	let area = $state<HTMLTextAreaElement | null>(null);
	let scrollTop = $state(0);

	const lineCount = $derived(value.split('\n').length);
	const digits = $derived(Math.max(2, String(lineCount).length));

	function syncScroll() {
		if (area) scrollTop = area.scrollTop;
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key !== 'Tab' || readonly || !area) return;
		event.preventDefault();
		const { selectionStart, selectionEnd } = area;
		value = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`;
		const caret = selectionStart + 2;
		requestAnimationFrame(() => {
			if (!area) return;
			area.selectionStart = caret;
			area.selectionEnd = caret;
		});
	}
</script>

<div
	class="relative flex overflow-hidden rounded-lg border border-line bg-bg transition-colors duration-150 focus-within:border-accent"
>
	<div
		class="shrink-0 overflow-hidden border-r border-line py-3 text-right font-mono text-[11.5px] leading-[1.7] text-[#4d5155] tabular-nums"
		style="width: calc({digits}ch + 20px)"
		aria-hidden="true"
	>
		<div style="transform: translateY(-{scrollTop}px)">
			{#each Array.from({ length: lineCount }, (_, i) => i + 1) as n (n)}
				<span class="block pr-2" class:text-err={errorLine === n}>{n}</span>
			{/each}
		</div>
	</div>

	<textarea
		bind:this={area}
		bind:value
		{placeholder}
		{readonly}
		spellcheck="false"
		autocapitalize="off"
		autocomplete="off"
		aria-label={ariaLabel}
		class="min-w-0 flex-1 resize-none bg-transparent px-3 py-3 font-mono text-[12.5px] leading-[1.7] text-[#d6d8d6] caret-accent outline-none placeholder:text-dim"
		style="min-height: {minHeight}"
		onscroll={syncScroll}
		{onkeydown}></textarea>
</div>
