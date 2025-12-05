<script lang="ts">
	import { Users, Building2, Heart, Star } from 'lucide-svelte';

	const stats = [
		{ label: 'Masjid Terdaftar', value: '150+', icon: Building2 },
		{ label: 'Pengguna Aktif', value: '2.5k+', icon: Users },
		{ label: 'Total Donasi', value: 'Rp 5M+', icon: Heart },
		{ label: 'Rating Kepuasan', value: '4.9/5', icon: Star }
	];
</script>

<section class="bg-primary text-primary-content py-16">
	<div class="container mx-auto px-4">
		<div class="grid grid-cols-2 gap-8 md:grid-cols-4">
			{#each stats as stat}
				<div class="text-center">
					<div class="mb-4 flex justify-center opacity-80">
						<stat.icon class="h-8 w-8" />
					</div>
					<div class="text-4xl font-bold mb-2">{stat.value}</div>
					<div class="text-sm font-medium opacity-80 uppercase tracking-wider">{stat.label}</div>
				</div>
			{/each}
		</div>
	</div>
</section>
