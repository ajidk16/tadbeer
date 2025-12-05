<script lang="ts">
	import { Wallet, Calendar, Box, Users, FileText, Smartphone } from 'lucide-svelte';

	const features = [
		{
			icon: Calendar,
			title: 'Jadwal Kegiatan',
			description:
				'Kelola jadwal pengajian, sholat jumat, dan kegiatan masjid lainnya agar jamaah selalu terupdate.',
			color: 'text-blue-500',
			bg: 'bg-blue-500/10'
		},
		{
			icon: Box,
			title: 'Inventaris Aset',
			description:
				'Data aset masjid tersimpan rapi. Pantau kondisi barang dan riwayat peminjaman dengan sistematis.',
			color: 'text-amber-500',
			bg: 'bg-amber-500/10'
		},
		{
			icon: Users,
			title: 'Database Jamaah',
			description:
				'Kelola data jamaah, donatur, dan pengurus DKM dalam satu database yang aman dan terintegrasi.',
			color: 'text-purple-500',
			bg: 'bg-purple-500/10'
		},
		{
			icon: FileText,
			title: 'Laporan Digital',
			description: 'Export laporan kegiatan ke format PDF atau Excel untuk kebutuhan administrasi.',
			color: 'text-rose-500',
			bg: 'bg-rose-500/10'
		},
		{
			icon: Smartphone,
			title: 'Mobile Friendly',
			description:
				'Akses sistem dari mana saja menggunakan smartphone, tablet, atau laptop dengan tampilan responsif.',
			color: 'text-cyan-500',
			bg: 'bg-cyan-500/10'
		}
	];
</script>

<section id="features" class="section-padding bg-base-100 relative overflow-hidden">
	<div class="container mx-auto px-4">
		<!-- Section Header -->
		<div class="mb-16 text-center">
			<h2 class="text-display mb-4">Fitur Unggulan</h2>
			<p class="text-title mx-auto max-w-2xl font-normal text-base-content/70">
				Semua yang Anda butuhkan untuk mengelola masjid ada di sini. Dirancang khusus untuk
				kemudahan pengurus DKM.
			</p>
		</div>

		<!-- Features Grid -->
		<div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
			{#each features as feature, i}
				<div
					class="card bg-base-100 border border-base-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 scroll-reveal"
					class:stagger-1={i === 0}
					class:stagger-2={i === 1}
					class:stagger-3={i === 2}
					class:stagger-4={i === 3}
					class:stagger-5={i === 4}
					class:stagger-6={i === 5}
				>
					<div class="card-body">
						<div
							class={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg} ${feature.color}`}
						>
							<feature.icon class="h-6 w-6" />
						</div>
						<h3 class="card-title mb-2 text-xl">{feature.title}</h3>
						<p class="text-base-content/70 leading-relaxed">
							{feature.description}
						</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>
