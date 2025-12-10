<script lang="ts">
	import { Search, Package, ArrowRight, X, Calendar, User, Phone, FileText } from 'lucide-svelte';
	import { Badge, Toast, success as toastSuccess, error as toastError } from '$lib/components/ui';
	import { page } from '$app/state';
	import { superForm } from 'sveltekit-superforms';

	// Get data from server
	const assets = $derived(page.data.assets);
	const categories = $derived(page.data.categories);

	const {
		form: borrowFormData,
		errors: borrowErrors,
		enhance: borrowEnhance,
		delayed: borrowDelayed,
		reset: resetBorrowForm
	} = superForm(page.data.form, {
		onResult: ({ result }) => {
			if (result.type === 'success' && result.data?.success) {
				toastSuccess('Pengajuan peminjaman berhasil! Kami akan menghubungi Anda.');
				showBorrowModal = false;
				selectedAsset = null;
				resetBorrowForm();
			} else if (result.type === 'failure') {
				toastError(result.data?.message || 'Gagal mengajukan peminjaman');
			}
		}
	});

	let searchQuery = $state('');
	let selectedCategory = $state('Semua');
	let showBorrowModal = $state(false);
	let selectedAsset = $state<(typeof assets)[0] | null>(null);

	const filteredAssets = $derived(
		assets.filter((asset) => {
			const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesCategory = selectedCategory === 'Semua' || asset.category === selectedCategory;
			return matchesSearch && matchesCategory;
		})
	);

	function openBorrowModal(asset: (typeof assets)[0]) {
		selectedAsset = asset;
		$borrowFormData.assetId = asset.id;
		showBorrowModal = true;
	}
</script>

<svelte:head>
	<title>Inventaris Masjid | TadBeer</title>
</svelte:head>

<Toast />

<div class="container mx-auto px-4 py-8 pb-24 md:pb-8">
	<!-- Header -->
	<div class="mb-8 text-center max-w-2xl mx-auto">
		<h1 class="text-3xl font-bold text-primary mb-2">Inventaris Masjid</h1>
		<p class="text-base-content/70">
			Daftar aset masjid yang dapat digunakan atau dipinjam oleh jamaah untuk kegiatan keagamaan dan
			sosial.
		</p>
	</div>

	<!-- Search & Filter -->
	<div
		class="mb-8 flex flex-col md:flex-row gap-4 justify-between items-center bg-base-100 p-4 rounded-xl shadow-sm border border-base-200"
	>
		<div class="relative w-full md:w-96">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
			<input
				type="text"
				placeholder="Cari aset..."
				class="input input-bordered w-full pl-10"
				bind:value={searchQuery}
			/>
		</div>

		<div class="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
			{#each categories as category}
				<button
					class="btn btn-sm {selectedCategory === category ? 'btn-primary' : 'btn-ghost'}"
					onclick={() => (selectedCategory = category)}
				>
					{category}
				</button>
			{/each}
		</div>
	</div>

	<!-- Grid -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
		{#each filteredAssets as asset}
			<div
				class="card bg-base-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border border-base-200 group"
			>
				<figure class="relative h-48 overflow-hidden bg-base-200">
					<img
						src={asset.image}
						alt={asset.name}
						class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
					/>
					<div class="absolute top-3 right-3">
						<Badge variant={asset.available > 0 ? 'success' : 'error'} class="shadow-sm">
							{asset.available > 0 ? 'Tersedia' : 'Habis'}
						</Badge>
					</div>
				</figure>
				<div class="card-body p-4">
					<div class="text-xs text-base-content/50 font-medium uppercase tracking-wider mb-1">
						{asset.category}
					</div>
					<h3 class="card-title text-lg font-bold mb-2">
						{asset.name}
					</h3>

					<div
						class="flex items-center justify-between text-sm text-base-content/70 mt-2 mb-4 bg-base-200/50 p-2 rounded-lg"
					>
						<div class="flex flex-col">
							<span class="text-xs">Total</span>
							<span class="font-bold">{asset.stock} Unit</span>
						</div>
						<div class="divider divider-horizontal mx-0"></div>
						<div class="flex flex-col text-right">
							<span class="text-xs">Tersedia</span>
							<span class="font-bold text-primary">{asset.available} Unit</span>
						</div>
					</div>

					<div class="card-actions">
						<button
							class="btn btn-primary btn-sm w-full"
							disabled={asset.available === 0}
							onclick={() => openBorrowModal(asset)}
						>
							Ajukan Peminjaman
							<ArrowRight class="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>
		{/each}
	</div>

	{#if filteredAssets.length === 0}
		<div class="text-center py-12">
			<div class="bg-base-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
				<Package class="w-8 h-8 text-base-content/40" />
			</div>
			<h3 class="text-lg font-bold mb-2">Aset tidak ditemukan</h3>
			<p class="text-base-content/60">Coba kata kunci lain atau ubah filter kategori.</p>
		</div>
	{/if}
</div>

<!-- Borrow Modal -->
<dialog class="modal modal-bottom sm:modal-middle" class:modal-open={showBorrowModal}>
	<div class="modal-box p-0 overflow-hidden max-w-lg">
		<!-- Header -->
		<div class="bg-gradient-to-r from-primary to-secondary text-primary-content p-6">
			<button
				class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3 text-white/70 hover:text-white"
				onclick={() => (showBorrowModal = false)}
			>
				<X class="w-5 h-5" />
			</button>
			<h3 class="font-bold text-xl flex items-center gap-2">
				<Package class="w-6 h-6" />
				Ajukan Peminjaman
			</h3>
			{#if selectedAsset}
				<p class="text-primary-content/80 text-sm mt-1">{selectedAsset.name}</p>
			{/if}
		</div>

		<form method="POST" action="?/borrow" use:borrowEnhance class="p-6 space-y-5">
			<input type="hidden" name="assetId" value={selectedAsset?.id || 0} />

			<!-- Borrower Info -->
			<div class="space-y-4">
				<div class="form-control">
					<label class="label" for="borrowerName">
						<span class="label-text font-medium flex items-center gap-2">
							<User class="w-4 h-4" /> Nama Peminjam
						</span>
					</label>
					<input
						type="text"
						id="borrowerName"
						name="borrowerName"
						placeholder="Nama lengkap"
						class="input input-bordered"
						bind:value={$borrowFormData.borrowerName}
					/>
					{#if $borrowErrors.borrowerName}
						<span class="text-error text-xs mt-1">{$borrowErrors.borrowerName}</span>
					{/if}
				</div>

				<div class="form-control">
					<label class="label" for="borrowerContact">
						<span class="label-text font-medium flex items-center gap-2">
							<Phone class="w-4 h-4" /> Nomor HP / WhatsApp
						</span>
					</label>
					<input
						type="tel"
						id="borrowerContact"
						name="borrowerContact"
						placeholder="08xx-xxxx-xxxx"
						class="input input-bordered"
						bind:value={$borrowFormData.borrowerContact}
					/>
					{#if $borrowErrors.borrowerContact}
						<span class="text-error text-xs mt-1">{$borrowErrors.borrowerContact}</span>
					{/if}
				</div>
			</div>

			<!-- Date Range -->
			<div class="grid grid-cols-2 gap-4">
				<div class="form-control">
					<label class="label" for="borrowDate">
						<span class="label-text font-medium flex items-center gap-2">
							<Calendar class="w-4 h-4" /> Tanggal Pinjam
						</span>
					</label>
					<input
						type="date"
						id="borrowDate"
						name="borrowDate"
						class="input input-bordered"
						bind:value={$borrowFormData.borrowDate}
					/>
					{#if $borrowErrors.borrowDate}
						<span class="text-error text-xs mt-1">{$borrowErrors.borrowDate}</span>
					{/if}
				</div>

				<div class="form-control">
					<label class="label" for="returnDate">
						<span class="label-text font-medium flex items-center gap-2">
							<Calendar class="w-4 h-4" /> Tanggal Kembali
						</span>
					</label>
					<input
						type="date"
						id="returnDate"
						name="returnDate"
						class="input input-bordered"
						bind:value={$borrowFormData.returnDate}
					/>
					{#if $borrowErrors.returnDate}
						<span class="text-error text-xs mt-1">{$borrowErrors.returnDate}</span>
					{/if}
				</div>
			</div>

			<!-- Notes -->
			<div class="form-control">
				<label class="label" for="notes">
					<span class="label-text font-medium flex items-center gap-2">
						<FileText class="w-4 h-4" /> Catatan (Opsional)
					</span>
				</label>
				<textarea
					id="notes"
					name="notes"
					placeholder="Keperluan peminjaman, jumlah unit, dll..."
					class="textarea textarea-bordered"
					rows="2"
					bind:value={$borrowFormData.notes}
				></textarea>
			</div>

			<!-- Submit -->
			<div class="flex gap-3 pt-2">
				<button
					type="button"
					class="btn btn-ghost flex-1"
					onclick={() => (showBorrowModal = false)}
				>
					Batal
				</button>
				<button type="submit" class="btn btn-primary flex-1" disabled={$borrowDelayed}>
					{#if $borrowDelayed}
						<span class="loading loading-spinner loading-sm"></span>
					{/if}
					Ajukan
				</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop bg-black/50">
		<button onclick={() => (showBorrowModal = false)}>close</button>
	</form>
</dialog>
