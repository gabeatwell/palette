<script lang="ts">
	import '../app.css';
	import Github from '$lib/components/Github.svelte';
	import Nav from '$lib/components/Nav.svelte';
	import { browser } from '$app/environment';

	let { children } = $props();

	$effect(() => {
		if (browser && 'serviceWorker' in navigator) {
			navigator.serviceWorker.register('/sw.js');
		}
	});
</script>

<main>
	<Nav />

	{@render children()}

	<Github />
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		min-height: 100vh;
		background-color: #f0f0f0;
	}
</style>
