<script lang="ts">
	import MarketingNavbar from '$lib/components/marketing/MarketingNavbar.svelte';
	import MarketingFooter from '$lib/components/marketing/MarketingFooter.svelte';
	import BottomNav from '$lib/components/marketing/BottomNav.svelte';

	let { children } = $props();
</script>

<div class="flex min-h-screen flex-col bg-base-100 font-sans antialiased">
	<!-- Accessibility: Skip to content -->
	<a
		href="#main-content"
		class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] btn btn-primary btn-sm"
	>
		Skip to content
	</a>

	<MarketingNavbar />

	<main id="main-content" class="flex-1 pt-16 pb-16 md:pb-0 focus:outline-none" tabindex="-1">
		{@render children()}
	</main>

	<MarketingFooter />
	<BottomNav />
</div>
