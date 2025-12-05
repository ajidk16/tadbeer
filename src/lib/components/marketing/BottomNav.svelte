<script lang="ts">
	import { Home, Calendar, Box, Heart, Menu } from 'lucide-svelte';
	import { page } from '$app/stores';

	const navItems = [
		{ href: '/', label: 'Beranda', icon: Home },
		{ href: '/events', label: 'Kegiatan', icon: Calendar },
		{ href: '/inventory', label: 'Inventaris', icon: Box },
		{ href: '/donation', label: 'Donasi', icon: Heart },
		{ href: '/info', label: 'Info', icon: Menu }
	];

	function isActive(href: string): boolean {
		if (href === '/') {
			return $page.url.pathname === '/';
		}
		return $page.url.pathname.startsWith(href);
	}
</script>

<div
	class="fixed bottom-0 left-0 z-50 w-full border-t border-base-200 bg-base-100 pb-safe md:hidden"
>
	<div class="flex h-16 items-center justify-around px-2">
		{#each navItems as item}
			<a
				href={item.href}
				class="flex flex-col items-center justify-center gap-1 p-2 transition-colors duration-200"
				class:text-primary={isActive(item.href)}
				class:text-base-content={!isActive(item.href)}
			>
				<item.icon class="h-6 w-6" stroke-width={isActive(item.href) ? 2.5 : 2} />
				<span class="text-[10px] font-medium">{item.label}</span>
			</a>
		{/each}
	</div>
</div>

<style>
	/* Safe area padding for iPhone X+ */
	.pb-safe {
		padding-bottom: env(safe-area-inset-bottom);
	}
</style>
