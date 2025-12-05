<script lang="ts">
	import { page } from '$app/state';
	import { House, ChevronRight } from 'lucide-svelte';

	interface BreadcrumbItem {
		label: string;
		href?: string;
	}

	// Generate breadcrumbs from URL path
	const breadcrumbs = $derived.by(() => {
		const pathname = page.url.pathname;
		const segments = pathname.split('/').filter(Boolean);

		// Route label mapping
		const labelMap: Record<string, string> = {
			dashboard: 'Dashboard',
			keuangan: 'Keuangan',
			pemasukan: 'Pemasukan',
			pengeluaran: 'Pengeluaran',
			laporan: 'Laporan',
			kegiatan: 'Kegiatan',
			jamaah: 'Jamaah',
			donasi: 'Donasi',
			inventaris: 'Inventaris',
			pengumuman: 'Pengumuman',
			settings: 'Pengaturan',
			profile: 'Profil',
			tambah: 'Tambah',
			edit: 'Edit'
		};

		const items: BreadcrumbItem[] = [];

		segments.forEach((segment, index) => {
			const href = '/' + segments.slice(0, index + 1).join('/');
			const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

			items.push({
				label,
				href: index < segments.length - 1 ? href : undefined
			});
		});

		return items;
	});
</script>

{#if breadcrumbs.length > 0}
	<nav aria-label="Breadcrumb" class="text-sm mb-4">
		<ol class="flex items-center gap-1 flex-wrap">
			<!-- Home -->
			<li>
				<a
					href="/dashboard"
					class="flex items-center gap-1 text-base-content/60 hover:text-primary transition-colors"
				>
					<House class="w-4 h-4" />
					<span class="sr-only">Dashboard</span>
				</a>
			</li>

			{#each breadcrumbs as item, index (index)}
				<li class="flex items-center gap-1">
					<ChevronRight class="w-4 h-4 text-base-content/40" />
					{#if item.href}
						<a href={item.href} class="text-base-content/60 hover:text-primary transition-colors">
							{item.label}
						</a>
					{:else}
						<span class="text-base-content font-medium">{item.label}</span>
					{/if}
				</li>
			{/each}
		</ol>
	</nav>
{/if}
