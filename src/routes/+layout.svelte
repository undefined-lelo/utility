<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import CommandPalette from '#lib/components/CommandPalette.svelte';
	import { TOOLS } from '#lib/tools/registry';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	let paletteOpen = $state(false);

	const nav = [
		{ href: '/#convert', label: 'Convert' },
		{ href: '/#parse', label: 'Parse' },
		{ href: '/#network', label: 'Network' }
	];

	function onkeydown(event: KeyboardEvent) {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			paletteOpen = true;
		}
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<svelte:window {onkeydown} />

<div class="flex min-h-dvh flex-col">
	<header class="sticky top-0 z-40 border-b border-line bg-bg">
		<div class="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-5 sm:px-8">
			<a href="/" class="flex items-center gap-2" aria-label="utility home">
				<span class="text-[13px] font-semibold tracking-[-0.01em]">utility</span>
				<span class="h-1.25 w-1.25 rounded-full bg-accent" aria-hidden="true"></span>
			</a>

			<nav class="hidden items-center gap-5 sm:flex" aria-label="Sections">
				{#each nav as item (item.href)}
					<a
						href={item.href}
						class="text-[12.5px] text-mut transition-colors duration-150 hover:text-fg"
						>{item.label}</a
					>
				{/each}
			</nav>

			<div class="ml-auto flex items-center gap-3">
				<span class="hidden text-[11.5px] text-dim sm:inline">{TOOLS.length} tools</span>
				<button
					type="button"
					class="flex h-8 items-center gap-2 rounded-md border border-line bg-surface px-2 text-[12px] text-mut transition-colors duration-150 hover:border-line-strong hover:text-fg"
					onclick={() => (paletteOpen = true)}
					aria-label="Search tools"
				>
					<svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true">
						<circle cx="6" cy="6" r="4.3" fill="none" stroke="currentColor" stroke-width="1.3" />
						<path
							d="m9.3 9.3 3 3"
							stroke="currentColor"
							stroke-width="1.3"
							stroke-linecap="round"
						/>
					</svg>
					<span class="hidden sm:inline">Search</span>
					<kbd class="kbd">⌘K</kbd>
				</button>
			</div>
		</div>
	</header>

	<main class="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8">
		{@render children()}
	</main>

	<footer class="border-t border-line">
		<div
			class="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-5 text-[11.5px] text-dim sm:flex-row sm:items-center sm:justify-between sm:px-8"
		>
			<span>Parsers run in your browser. Network tools are proxied by the server.</span>
			<span class="flex flex-wrap items-center gap-4">
				<a
					class="transition-colors duration-150 hover:text-fg"
					href="https://ip-api.com"
					target="_blank"
					rel="noreferrer">ip-api.com</a
				>
				<a
					class="transition-colors duration-150 hover:text-fg"
					href="https://check-host.net/about/api"
					target="_blank"
					rel="noreferrer">check-host.net</a
				>
			</span>
		</div>
	</footer>
</div>

<CommandPalette bind:open={paletteOpen} />
