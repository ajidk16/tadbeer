<script lang="ts">
	import MarketingNavbar from '$lib/components/marketing/MarketingNavbar.svelte';
	import MarketingFooter from '$lib/components/marketing/MarketingFooter.svelte';

	let { children } = $props();
</script>

<div class="flex min-h-screen flex-col bg-base-100 font-sans antialiased">
	<MarketingNavbar />

	<main class="flex-1 pt-16">
		{@render children()}
	</main>

	<MarketingFooter />
</div>
