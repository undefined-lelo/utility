<script lang="ts">
	import AstTree from '#lib/components/AstTree.svelte';
	import CodeEditor from '#lib/components/CodeEditor.svelte';
	import CopyButton from '#lib/components/CopyButton.svelte';
	import { LANGS, LANG_ORDER, runParse } from '#lib/tools/parsers/index';
	import type { AstNode, LangId, ParseOutcome } from '#lib/tools/parsers/types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const lang = $derived(data.lang as LangId);
	const meta = $derived(LANGS[lang]);

	let typescript = $state(false);
	let source = $state('');
	let outcome = $state<ParseOutcome>({
		ok: true,
		nodes: [],
		issues: [],
		stats: { nodes: 0, depth: 0, ms: 0, lines: 0, chars: 0 }
	});
	let selected = $state<AstNode | null>(null);
	let parsing = $state(false);
	let errorLine = $state<number | null>(null);

	let formatting = $state(false);
	let formatError = $state('');
	let formatNote = $state('');

	const issueCount = $derived(outcome.issues.length);

	const selectedSlice = $derived.by(() => {
		const node = selected;
		if (!node || node.from === undefined || node.to === undefined) return null;
		const text = source.slice(node.from, node.to);
		if (!text.trim()) return null;
		return text.length > 320 ? `${text.slice(0, 320)}…` : text;
	});

	const astJson = $derived(JSON.stringify(outcome.nodes, null, 2));

	$effect(() => {
		const id = lang;
		source = LANGS[id].sample;
		selected = null;
		formatError = '';
		formatNote = '';
	});

	let timer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		const code = source;
		const ts = typescript;
		const id = lang;

		parsing = true;
		clearTimeout(timer);
		timer = setTimeout(() => {
			outcome = runParse(id, code, { typescript: ts });
			errorLine = outcome.issues[0]?.line ?? null;
			selected = null;
			parsing = false;
		}, 160);

		return () => clearTimeout(timer);
	});

	async function format() {
		if (formatting) return;
		formatting = true;
		formatError = '';
		formatNote = '';

		try {
			const res = await fetch('/api/format', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ lang, code: source, typescript })
			});
			const data = await res.json();

			if (!res.ok) {
				formatError = data?.error ?? 'Could not format that source.';
				return;
			}

			if (data.code === source) {
				formatNote = 'Already formatted';
			} else {
				source = data.code;
				formatNote = 'Formatted';
			}
		} catch {
			formatError = 'Could not reach the formatter.';
		} finally {
			formatting = false;
		}
	}

	function loadSample() {
		source = meta.sample;
		formatNote = '';
		formatError = '';
	}

	function jumpToIssue(line: number) {
		const offset =
			source
				.split('\n')
				.slice(0, line - 1)
				.join('\n').length + (line > 1 ? 1 : 0);
		const element = document.getElementById('editor-anchor');
		element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
		const textarea = element?.querySelector('textarea');
		if (textarea) {
			textarea.focus();
			const end = source.indexOf('\n', offset);
			textarea.setSelectionRange(offset, end === -1 ? source.length : end);
		}
	}
</script>

<svelte:head>
	<title>{meta.label} parser · utility</title>
</svelte:head>

<header class="mb-6">
	<p class="label">Parse</p>
	<div class="mt-1 flex flex-wrap items-baseline justify-between gap-3">
		<h1 class="text-[24px] font-medium tracking-[-0.01em]">{meta.label}</h1>
		<div class="inline-flex overflow-hidden rounded-md border border-line">
			{#each LANG_ORDER as id, i (id)}
				<a
					href="/parse/{id}"
					class="flex h-8 items-center px-2.5 text-[11.5px] transition-colors duration-150 {id ===
					lang
						? 'bg-raised text-fg'
						: 'text-mut hover:text-fg'} {i > 0 ? 'border-l border-line' : ''}"
					aria-current={id === lang ? 'page' : undefined}>{LANGS[id].short}</a
				>
			{/each}
		</div>
	</div>
	<p class="mt-2 max-w-[72ch] text-[13px] leading-relaxed text-mut">{meta.note}</p>
</header>

<div class="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line pb-3">
	<span class="text-[11.5px] text-dim">{meta.engine}</span>
	<span class="text-[11.5px] text-dim">
		{outcome.stats.nodes} nodes · depth {outcome.stats.depth} · {outcome.stats.ms} ms
	</span>

	{#if parsing}
		<span class="text-[11.5px] text-dim">Parsing…</span>
	{:else if issueCount === 0}
		<span class="text-[11.5px] text-mut">No syntax errors</span>
	{:else}
		<span class="text-[11.5px] text-err">
			{issueCount}
			{issueCount === 1 ? 'issue' : 'issues'}
		</span>
	{/if}

	<div class="ml-auto flex flex-wrap items-center gap-2">
		{#if lang === 'js'}
			<button
				type="button"
				class="rounded-sm border px-1.5 py-0.5 text-[11px] transition-colors duration-150 {typescript
					? 'border-accent/60 text-accent'
					: 'border-line text-mut hover:border-line-strong hover:text-fg'}"
				aria-pressed={typescript}
				onclick={() => (typescript = !typescript)}
			>
				TypeScript
			</button>
		{/if}
		<button type="button" class="btn" onclick={format} disabled={formatting || parsing}>
			{formatting
				? 'Formatting…'
				: `Format with ${lang === 'python' ? 'Ruff' : lang === 'rust' ? 'rustfmt' : 'Prettier'}`}
		</button>
		<button type="button" class="btn btn-quiet" onclick={loadSample}>Reset sample</button>
		<CopyButton value={astJson}>Copy AST</CopyButton>
	</div>
</div>

{#if formatError}
	<p class="mb-2 text-[11.5px] leading-relaxed text-err">{formatError}</p>
{:else if formatNote}
	<p class="mb-2 text-[11.5px] text-dim">{formatNote}</p>
{/if}

<div class="grid gap-4 lg:grid-cols-2">
	<div class="flex min-w-0 flex-col gap-3">
		<div id="editor-anchor">
			<CodeEditor
				bind:value={source}
				{errorLine}
				placeholder="Paste {meta.short} source here"
				minHeight="24rem"
				ariaLabel="{meta.label} source"
			/>
		</div>

		{#if issueCount > 0}
			<div class="rounded-lg border border-line">
				<div class="border-b border-line px-3 py-2">
					<span class="text-[11.5px] font-medium text-err">Diagnostics</span>
				</div>
				<ul class="max-h-40 divide-y divide-line overflow-auto">
					{#each outcome.issues as issue, i (i)}
						<li>
							<button
								type="button"
								class="flex w-full items-start gap-3 px-3 py-2 text-left transition-colors duration-150 hover:bg-surface"
								onclick={() => jumpToIssue(issue.line)}
							>
								<span class="shrink-0 font-mono text-[11px] text-dim tabular-nums">
									{issue.line}:{issue.column + 1}
								</span>
								<span class="text-[11.5px] leading-relaxed text-mut">{issue.message}</span>
							</button>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if selectedSlice}
			<div class="overflow-hidden rounded-lg border border-line">
				<div class="flex items-baseline justify-between gap-3 border-b border-line px-3 py-2">
					<span class="font-mono text-[11px] text-mut">{selected?.label}</span>
					<span class="font-mono text-[10.5px] text-dim tabular-nums">
						{selected?.from}–{selected?.to}
					</span>
				</div>
				<pre
					class="max-h-40 overflow-auto p-3 font-mono text-[11.5px] leading-relaxed whitespace-pre-wrap text-mut">{selectedSlice}</pre>
			</div>
		{/if}
	</div>

	<div class="min-h-96 overflow-hidden rounded-lg border border-line">
		<AstTree
			nodes={outcome.nodes}
			{selected}
			truncated={outcome.truncated}
			onselect={(node) => (selected = node)}
		/>
	</div>
</div>
