<script lang="ts">
	import { page } from '$app/state';
	import { AlertTriangle, Home, ArrowLeft, RefreshCcw } from 'lucide-svelte';

	// Get status and error from page store
	let status = $derived(page.status);
	let error = $derived(page.error);

	let title = $derived(
		status === 404
			? 'Halaman Tidak Ditemukan'
			: status === 500
				? 'Terjadi Kesalahan Server'
				: 'Terjadi Kesalahan'
	);

	let description = $derived(
		status === 404
			? 'Maaf, halaman yang Anda cari tidak dapat ditemukan. Mungkin halaman telah dipindahkan atau dihapus.'
			: status === 500
				? 'Maaf, terjadi kesalahan pada server kami. Silakan coba beberapa saat lagi.'
				: (error?.message ?? 'Terjadi kesalahan yang tidak terduga.')
	);

	function goBack() {
		window.history.back();
	}
</script>

<div class="min-h-screen bg-base-100 flex items-center justify-center p-4 relative overflow-hidden">
	<!-- Background Pattern -->
	<div class="absolute inset-0 opacity-5 islamic-pattern pointer-events-none"></div>

	<!-- Decorative Blobs -->
	<div
		class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10 animate-pulse"
	></div>
	<div
		class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl -z-10 animate-pulse"
		style="animation-delay: 1s;"
	></div>

	<div class="card max-w-lg w-full glass shadow-2xl animate-fadeIn">
		<div class="card-body text-center items-center py-12">
			<!-- Icon Wrapper -->
			<div class="relative mb-6">
				<div
					class="w-24 h-24 rounded-full bg-error/10 flex items-center justify-center animate-bounce-gentle"
				>
					<AlertTriangle class="w-12 h-12 text-error" />
				</div>
				<!-- Status Badge -->
				<div class="absolute -bottom-2 -right-2 badge badge-error badge-lg font-bold shadow-lg">
					{status}
				</div>
			</div>

			<!-- Content -->
			<h1 class="text-3xl font-bold mb-2 font-heading">{title}</h1>
			<p class="text-base-content/70 mb-8 leading-relaxed">
				{description}
			</p>

			<!-- Actions -->
			<div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
				<button onclick={goBack} class="btn btn-outline gap-2 hover-lift">
					<ArrowLeft class="w-4 h-4" />
					Kembali
				</button>
				<a href="/" class="btn btn-primary text-white gap-2 hover-lift shadow-lg shadow-primary/30">
					<Home class="w-4 h-4" />
					Ke Beranda
				</a>
			</div>

			<!-- Technical Details (Optional, for debugging) -->
			{#if status !== 404 && error?.message}
				<div class="collapse collapse-arrow bg-base-200/50 mt-8 text-left text-sm rounded-lg">
					<input type="checkbox" />
					<div class="collapse-title font-medium text-base-content/60">Detail Teknis</div>
					<div class="collapse-content">
						<pre class="whitespace-pre-wrap font-mono text-xs opacity-70 bg-base-300 p-4 rounded">
{JSON.stringify(error, null, 2)}</pre>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
