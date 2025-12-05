<script lang="ts">
	import Hero from '$lib/components/marketing/Hero.svelte';
	import FeatureSection from '$lib/components/marketing/FeatureSection.svelte';
	import TrustSection from '$lib/components/marketing/TrustSection.svelte';
	import { onMount } from 'svelte';

	onMount(() => {
		// Simple scroll reveal observer
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add('visible');
					}
				});
			},
			{ threshold: 0.1 }
		);

		document
			.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right')
			.forEach((el) => {
				observer.observe(el);
			});
	});
</script>

<Hero />
<TrustSection />
<FeatureSection />

<!-- Call to Action Section -->
<section class="section-padding bg-base-200 text-center">
	<div class="container mx-auto px-4">
		<div class="mx-auto max-w-3xl">
			<h2 class="text-display mb-6">Siap Mengelola Masjid Lebih Baik?</h2>
			<p class="text-title mb-8 font-normal text-base-content/70">
				Bergabunglah dengan ratusan masjid lainnya yang telah beralih ke sistem digital. Coba gratis
				selama 14 hari, tanpa kartu kredit.
			</p>
			<a
				href="/auth/register"
				class="btn btn-primary btn-lg px-8 text-white shadow-xl shadow-primary/20 hover:scale-105"
			>
				Daftar Sekarang
			</a>
		</div>
	</div>
</section>
