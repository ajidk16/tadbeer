<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>MiniMasjid - Sistem Manajemen Masjid</title>
</svelte:head>

{@render children()}
