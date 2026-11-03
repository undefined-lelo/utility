<script lang="ts">
	import { page } from '$app/state';

	const message = $derived(page.error?.message ?? 'Something went wrong.');
</script>

<svelte:head>
	<title>{page.status} — utility</title>
</svelte:head>

<div class="mx-auto flex max-w-md flex-col items-start gap-3 py-20">
	<p class="label">error {page.status}</p>
	<h1 class="text-2xl font-medium tracking-tight">{message}</h1>
	<p class="text-[13px] text-mut">
		The toolbox has {page.status === 404
			? 'no tool at that address'
			: 'a problem with that request'}.
	</p>
	<a href="/" class="btn btn-quiet mt-2 -ml-2">← back to tools</a>
</div>
