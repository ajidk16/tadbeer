<script lang="ts">
	import { ArrowRight, Play } from 'lucide-svelte';
</script>

<section class="parallax-hero relative overflow-hidden bg-base-100 text-base-content">
	<!-- Background Pattern -->
	<div class="absolute inset-0 z-0 opacity-5">
		<div class="islamic-pattern h-full w-full"></div>
	</div>

	<!-- Gradient Overlay -->
	<div
		class="absolute inset-0 z-0 bg-linear-to-b from-transparent via-base-100/50 to-base-100"
	></div>

	<div class="container relative z-10 mx-auto px-4 py-20 text-center lg:py-32">
		<!-- Badge -->
		<div class="animate-fadeIn mb-6 flex justify-center">
			<span class="badge badge-primary badge-lg gap-2 px-4 py-3 text-sm font-medium text-white">
				✨ Solusi Digital Masjid Modern
			</span>
		</div>

		<!-- Headline -->
		<h1
			class="text-display animate-fadeIn mx-auto mb-6 max-w-4xl tracking-tight"
			style="animation-delay: 0.1s;"
		>
			Kelola Masjid Lebih <span class="gradient-text">Modern</span> &
			<span class="gradient-text">Transparan</span>
		</h1>

		<!-- Subheadline -->
		<p
			class="text-headline animate-fadeIn mx-auto mb-10 max-w-2xl font-normal text-base-content/70"
			style="animation-delay: 0.2s;"
		>
			Platform manajemen masjid terlengkap untuk mengelola inventaris dan kegiatan umat dalam satu
			aplikasi yang mudah digunakan.
		</p>

		<!-- CTA Buttons -->
		<div
			class="animate-fadeIn flex flex-col items-center justify-center gap-4 sm:flex-row"
			style="animation-delay: 0.3s;"
		>
			<a
				href="/auth/register"
				class="btn btn-primary btn-lg gap-2 text-white shadow-xl shadow-primary/20 hover:scale-105"
			>
				Coba Gratis Sekarang
				<ArrowRight class="h-5 w-5" />
			</a>
			<a href="#features" class="btn btn-outline btn-lg gap-2 hover:bg-base-200">
				Lihat Fitur
			</a>
		</div>

		<!-- Dashboard Preview (Mockup) -->
		<!-- <div class="animate-fadeIn mt-16 lg:mt-24" style="animation-delay: 0.5s;">
			<div
				class="relative mx-auto max-w-5xl rounded-xl bg-base-300 p-2 shadow-2xl ring-1 ring-base-content/10 lg:rounded-2xl lg:p-4"
			>
				<div
					class="absolute -top-12 -left-12 -z-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl filter"
				></div>
				<div
					class="absolute -bottom-12 -right-12 -z-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl filter"
				></div>

				<div class="overflow-hidden rounded-lg bg-base-100 shadow-inner lg:rounded-xl">
					<div
						class="aspect-video w-full bg-base-200 flex items-center justify-center text-base-content/30"
					>
						<div class="text-center">
							<span class="text-6xl mb-4 block">🖥️</span>
							<p class="text-lg font-medium">Dashboard Preview</p>
						</div>
					</div>
				</div>
			</div>
		</div> -->
	</div>
</section>
