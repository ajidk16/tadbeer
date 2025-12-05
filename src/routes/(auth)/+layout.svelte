<script lang="ts">
	// import '../layout.css'
	import { page } from '$app/stores';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { Toast } from '$lib/components/ui';

	let { children } = $props();
</script>

<!-- Global Toast Container for Auth Pages -->
<Toast />

<!-- Auth Layout Wrapper -->
<div
	class="min-h-screen bg-base-100 font-sans text-base-content selection:bg-primary selection:text-primary-content"
>
	{#key $page.url.pathname}
		<div
			in:fly={{ x: -20, duration: 300, delay: 150, easing: cubicOut }}
			out:fly={{ x: 20, duration: 300, easing: cubicOut }}
			class="min-h-screen w-full"
		>
			{@render children()}
		</div>
	{/key}
</div>
