<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import { transactionSchema } from '$lib/schemas';
	import { Badge, Toast, success as toastSuccess, error as toastError } from '$lib/components/ui';
	import {
		Plus,
		Download,
		Eye,
		SquarePen,
		Trash2,
		X,
		Save,
		Image as ImageIcon
	} from 'lucide-svelte';
	import { onMount, tick } from 'svelte';

	let { data } = $props();

	// Initialize superform
	const { form, errors, message, constraints, enhance, submitting, capture, restore } = superForm(
		data.form,
		{
			validators: valibotClient(transactionSchema),
			resetForm: false, // Don't reset automatically, we handle it
			onResult: async ({ result }) => {
				if (result.type === 'success') {
					toastSuccess(isEditMode ? 'Berhasil diperbarui' : 'Berhasil ditambahkan');
					closeFormModal();
				} else if (result.type === 'failure') {
					toastError(result.data?.message || 'Terjadi kesalahan');
				}
			}
		}
	);

	// Filter states
	let searchQuery = $state('');
	let selectedCategory = $state('');

	// Modal states
	let showDetailModal = $state(false);
	let showDeleteModal = $state(false);
	let showFormModal = $state(false);
	let isEditMode = $state(false);
	let selectedTransaction = $state<(typeof data.transactions)[0] | null>(null);
	let fileInput: HTMLInputElement;
	let previewUrl = $state<string | undefined>(undefined);

	// Display states
	let formAmountFormatted = $state('');

	// Format currency
	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(value);
	}

	function formatAmountInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const value = input.value.replace(/\D/g, '');
		$form.amountRaw = Number(value); // Update form store directly
		formAmountFormatted = value ? new Intl.NumberFormat('id-ID').format(Number(value)) : '';
		input.value = formAmountFormatted;
	}

	// Filtered transactions
	const filteredTransactions = $derived(() => {
		let result = data.transactions || [];

		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(tx) =>
					tx.description.toLowerCase().includes(query) || tx.category.toLowerCase().includes(query)
			);
		}

		if (selectedCategory) {
			result = result.filter((tx) => tx.category === selectedCategory);
		}

		return result;
	});

	const totalAmount = $derived(
		filteredTransactions().reduce((sum, tx) => sum + Number(tx.amount), 0)
	);

	// Open form modal for add
	function openAddModal() {
		isEditMode = false;
		selectedTransaction = null;
		// Reset form
		$form.id = undefined;
		$form.date = new Date().toISOString().split('T')[0];
		$form.category = '';
		$form.amountRaw = 0;
		$form.description = '';
		$form.notes = '';
		formAmountFormatted = '';
		previewUrl = undefined;
		showFormModal = true;
	}

	// Open form modal for edit
	function openEditModal(tx: (typeof data.transactions)[0]) {
		isEditMode = true;
		selectedTransaction = tx;
		// Fill form
		$form.id = tx.id;
		$form.date = new Date(tx.date).toISOString().split('T')[0];
		$form.category = tx.category;
		$form.amountRaw = Number(tx.amount);
		$form.description = tx.description;
		$form.notes = tx.notes || '';

		formAmountFormatted = new Intl.NumberFormat('id-ID').format(Number(tx.amount));
		previewUrl = tx.proofUrl || undefined;

		showFormModal = true;
	}

	function closeFormModal() {
		showFormModal = false;
		selectedTransaction = null;
	}

	function openDetail(tx: (typeof data.transactions)[0]) {
		selectedTransaction = tx;
		showDetailModal = true;
	}

	function openDelete(tx: (typeof data.transactions)[0]) {
		selectedTransaction = tx;
		showDeleteModal = true;
	}

	function handleFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			const file = input.files[0];
			previewUrl = URL.createObjectURL(file);
		}
	}

	// Export Functions
	function exportToCSV() {
		const headers = ['Tanggal', 'Kategori', 'Keterangan', 'Jumlah', 'Catatan'];
		const rows = filteredTransactions().map((tx) => [
			new Date(tx.date).toLocaleDateString('id-ID'),
			tx.category,
			`"${tx.description}"`, // Quote description to handle commas
			tx.amount,
			`"${tx.notes || ''}"`
		]);

		const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.setAttribute('href', url);
		link.setAttribute('download', `pemasukan_${new Date().toISOString().slice(0, 10)}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	function printPDF() {
		window.print();
	}
</script>

<svelte:head>
	<title>Pemasukan | Keuangan | TadBeer</title>
	<style>
		@media print {
			/* Hide non-essential elements for printing */
			.navbar,
			.btn,
			.input,
			.select,
			.dropdown,
			.modal,
			footer {
				display: none !important;
			}
			/* Improve table readability for print */
			.card {
				box-shadow: none !important;
				border: 1px solid #ccc;
			}
			body {
				background-color: white;
			}
			.print-header {
				display: block !important;
				text-align: center;
				margin-bottom: 20px;
			}
		}
		.print-header {
			display: none;
		}
	</style>
</svelte:head>

<Toast />

<div class="print-header">
	<h1 class="text-2xl font-bold">Laporan Pemasukan Masjid</h1>
	<p>Generated on {new Date().toLocaleDateString('id-ID')}</p>
</div>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold">💰 Pemasukan</h1>
			<p class="text-base-content/60 mt-1">Kelola data pemasukan masjid</p>
		</div>
		<button class="btn btn-primary" onclick={openAddModal}>
			<Plus class="w-4 h-4" />
			Tambah Pemasukan
		</button>
	</div>

	<!-- Stats Summary -->
	<div class="stats stats-vertical sm:stats-horizontal shadow w-full">
		<div class="stat">
			<div class="stat-title">Total Pemasukan</div>
			<div class="stat-value text-success text-xl">{formatCurrency(data.totalIncome || 0)}</div>
			<div class="stat-desc">Bulan ini</div>
		</div>
		<div class="stat">
			<div class="stat-title">Jumlah Transaksi</div>
			<div class="stat-value text-xl">{data.transactionCount || 0}</div>
			<div class="stat-desc">transaksi</div>
		</div>
		<div class="stat">
			<div class="stat-title">Rata-rata</div>
			<div class="stat-value text-xl">
				{formatCurrency(
					data.transactionCount ? (data.totalIncome || 0) / data.transactionCount : 0
				)}
			</div>
			<div class="stat-desc">per transaksi</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="flex flex-wrap gap-3 items-center">
		<div class="flex-1 min-w-[200px]">
			<input
				type="text"
				placeholder="Cari transaksi..."
				class="input input-bordered w-full input-sm"
				bind:value={searchQuery}
			/>
		</div>
		<select class="select select-bordered select-sm" bind:value={selectedCategory}>
			<option value="">Semua Kategori</option>
			{#each data.categories || [] as cat}
				<option value={cat}>{cat}</option>
			{/each}
		</select>
		<div class="dropdown dropdown-end">
			<button class="btn btn-ghost btn-sm">
				<Download class="w-4 h-4" />
				Export
			</button>
			<ul class="dropdown-content menu bg-base-100 rounded-box shadow-lg z-10 w-40 p-2">
				<li><button onclick={exportToCSV}>Excel (CSV)</button></li>
				<li><button onclick={printPDF}>PDF (Print)</button></li>
			</ul>
		</div>
	</div>

	<!-- Transactions Table -->
	<div class="card bg-base-100 shadow-sm">
		<div class="card-body p-0">
			<div class="overflow-x-auto">
				<table class="table">
					<thead>
						<tr>
							<th>Tanggal</th>
							<th>Keterangan</th>
							<th>Kategori</th>
							<th class="text-right">Jumlah</th>
							<th class="text-center">Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredTransactions() as tx (tx.id)}
							<tr class="hover:bg-base-200/50">
								<td>
									<div class="text-sm">
										{new Date(tx.date).toLocaleDateString('id-ID', {
											day: 'numeric',
											month: 'short',
											year: 'numeric'
										})}
									</div>
								</td>
								<td>
									<div class="font-medium">{tx.description}</div>
									{#if tx.notes}
										<div class="text-xs text-base-content/50">{tx.notes}</div>
									{/if}
								</td>
								<td>
									<Badge variant="ghost">{tx.category}</Badge>
								</td>
								<td class="text-right">
									<span class="font-mono text-success font-medium">
										+{formatCurrency(Number(tx.amount))}
									</span>
								</td>
								<td>
									<div class="flex justify-center gap-1">
										<button
											class="btn btn-ghost btn-xs btn-square"
											title="Lihat Detail"
											onclick={() => openDetail(tx)}
										>
											<Eye class="w-4 h-4" />
										</button>
										<button
											class="btn btn-ghost btn-xs btn-square"
											title="Edit"
											onclick={() => openEditModal(tx)}
										>
											<SquarePen class="w-4 h-4" />
										</button>
										<button
											class="btn btn-ghost btn-xs btn-square text-error"
											title="Hapus"
											onclick={() => openDelete(tx)}
										>
											<Trash2 class="w-4 h-4" />
										</button>
									</div>
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="5" class="text-center py-12">
									<div class="text-base-content/50">
										<p class="text-lg mb-2">📭</p>
										<p>Tidak ada data pemasukan</p>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
					{#if filteredTransactions().length > 0}
						<tfoot>
							<tr class="bg-base-200/50">
								<td colspan="3" class="font-semibold">Total</td>
								<td class="text-right font-mono text-success font-bold">
									+{formatCurrency(totalAmount)}
								</td>
								<td></td>
							</tr>
						</tfoot>
					{/if}
				</table>
			</div>
		</div>
	</div>
</div>

<!-- Add/Edit Modal (Superform) -->
{#if showFormModal}
	<dialog class="modal modal-open">
		<div class="modal-box max-w-lg">
			<button
				class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
				onclick={closeFormModal}
			>
				<X class="w-4 h-4" />
			</button>

			<h3 class="font-bold text-lg mb-4">
				{isEditMode ? '✏️ Edit Pemasukan' : '➕ Tambah Pemasukan'}
			</h3>

			<form
				method="POST"
				action={isEditMode ? '?/update' : '?/create'}
				use:enhance
				enctype="multipart/form-data"
				class="space-y-4"
			>
				{#if isEditMode && selectedTransaction}
					<input type="hidden" name="id" value={$form.id} />
				{/if}

				<div class="grid grid-cols-2 gap-4">
					<div class="form-control">
						<label for="date" class="label"><span class="label-text">Tanggal *</span></label>
						<input
							type="date"
							name="date"
							class="input input-bordered w-full"
							bind:value={$form.date}
							aria-invalid={$errors.date ? 'true' : undefined}
							{...$constraints.date}
						/>
						{#if $errors.date}<span class="text-xs text-error mt-1">{$errors.date}</span>{/if}
					</div>
					<div class="form-control">
						<label for="category" class="label"><span class="label-text">Kategori *</span></label>
						<select
							name="category"
							class="select select-bordered"
							bind:value={$form.category}
							aria-invalid={$errors.category ? 'true' : undefined}
							{...$constraints.category}
						>
							<option value="" disabled selected>Pilih</option>
							<option value="infaq">Infaq</option>
							<option value="zakat">Zakat</option>
							<option value="sadaqah">Sadaqah</option>
							<option value="wakaf">Wakaf</option>
							<option value="lainnya">Lainnya</option>
						</select>
						{#if $errors.category}<span class="text-xs text-error mt-1">{$errors.category}</span
							>{/if}
					</div>
				</div>

				<div class="form-control">
					<label for="amountRaw" class="label"><span class="label-text">Jumlah *</span></label>
					<label class="input input-bordered w-full flex items-center gap-2">
						<span class="text-base-content/60">Rp</span>
						<input
							type="text"
							class="grow"
							placeholder="0"
							value={formAmountFormatted}
							oninput={formatAmountInput}
						/>
					</label>
					<input type="hidden" name="amountRaw" value={$form.amountRaw} />
					{#if $errors.amountRaw}<span class="text-xs text-error mt-1">{$errors.amountRaw}</span
						>{/if}
				</div>

				<div class="form-control">
					<label for="description" class="label"><span class="label-text">Keterangan *</span></label
					>
					<input
						type="text"
						name="description"
						class="input input-bordered w-full"
						placeholder="Contoh: Infaq Jumat"
						bind:value={$form.description}
						aria-invalid={$errors.description ? 'true' : undefined}
						{...$constraints.description}
					/>
					{#if $errors.description}<span class="text-xs text-error mt-1">{$errors.description}</span
						>{/if}
				</div>

				<div class="form-control">
					<label for="notes" class="label"><span class="label-text">Catatan</span></label>
					<textarea
						name="notes"
						class="textarea textarea-bordered w-full"
						rows="2"
						placeholder="Catatan tambahan..."
						bind:value={$form.notes}
						{...$constraints.notes}
					></textarea>
				</div>

				<!-- Image Upload -->
				<div class="form-control">
					<label for="proof" class="label"
						><span class="label-text">Bukti Transaksi (Opsional)</span></label
					>
					<input
						type="file"
						name="proof"
						accept="image/*"
						class="file-input file-input-bordered w-full"
						onchange={handleFileChange}
					/>
					{#if previewUrl}
						<div class="mt-2 relative w-full h-40 bg-base-200 rounded-lg overflow-hidden">
							<img src={previewUrl} alt="Preview" class="w-full h-full object-contain" />
						</div>
					{/if}
				</div>

				<div class="modal-action">
					<button type="button" class="btn btn-ghost" onclick={closeFormModal}>Batal</button>
					<button type="submit" class="btn btn-primary" disabled={$submitting}>
						{#if $submitting}
							<span class="loading loading-spinner loading-sm"></span>
						{:else}
							<Save class="w-4 h-4" />
						{/if}
						Simpan
					</button>
				</div>
			</form>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button onclick={closeFormModal}>close</button>
		</form>
	</dialog>
{/if}

<!-- Detail Modal -->
{#if showDetailModal && selectedTransaction}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<button
				class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
				onclick={() => {
					showDetailModal = false;
					selectedTransaction = null;
				}}
			>
				<X class="w-4 h-4" />
			</button>

			<h3 class="font-bold text-lg mb-4">📋 Detail Transaksi</h3>

			<div class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<p class="text-sm text-base-content/60">Tanggal</p>
						<p class="font-medium">
							{new Date(selectedTransaction.date).toLocaleDateString('id-ID', {
								weekday: 'long',
								day: 'numeric',
								month: 'long',
								year: 'numeric'
							})}
						</p>
					</div>
					<div>
						<p class="text-sm text-base-content/60">Kategori</p>
						<Badge variant="primary">{selectedTransaction.category}</Badge>
					</div>
				</div>

				<div>
					<p class="text-sm text-base-content/60">Keterangan</p>
					<p class="font-medium">{selectedTransaction.description}</p>
				</div>

				<div>
					<p class="text-sm text-base-content/60">Jumlah</p>
					<p class="text-2xl font-bold text-success">
						+{formatCurrency(Number(selectedTransaction.amount))}
					</p>
				</div>

				{#if selectedTransaction.notes}
					<div>
						<p class="text-sm text-base-content/60">Catatan</p>
						<p class="text-sm bg-base-200 rounded-lg p-3">{selectedTransaction.notes}</p>
					</div>
				{/if}

				{#if selectedTransaction.proofUrl}
					<div>
						<p class="text-sm text-base-content/60 mb-2">Bukti Transaksi</p>
						<div class="rounded-lg overflow-hidden border border-base-300">
							<img
								src={selectedTransaction.proofUrl}
								alt="Bukti"
								class="w-full max-h-60 object-contain"
							/>
						</div>
						<a
							href={selectedTransaction.proofUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="btn btn-xs btn-link mt-1 pl-0"
						>
							Lihat resolusi penuh
						</a>
					</div>
				{/if}
			</div>

			<div class="modal-action">
				<button
					class="btn btn-primary btn-sm"
					onclick={() => {
						showDetailModal = false;
						openEditModal(selectedTransaction!);
					}}
				>
					<SquarePen class="w-4 h-4" />
					Edit
				</button>
				<button
					class="btn btn-ghost btn-sm"
					onclick={() => {
						showDetailModal = false;
						selectedTransaction = null;
					}}
				>
					Tutup
				</button>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button
				onclick={() => {
					showDetailModal = false;
					selectedTransaction = null;
				}}>close</button
			>
		</form>
	</dialog>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteModal && selectedTransaction}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg text-error">⚠️ Hapus Transaksi</h3>
			<p class="py-4">Apakah Anda yakin ingin menghapus transaksi ini?</p>

			<div class="bg-base-200 rounded-lg p-4 mb-4">
				<p class="font-medium">{selectedTransaction.description}</p>
				<p class="text-success font-mono">+{formatCurrency(Number(selectedTransaction.amount))}</p>
				<p class="text-sm text-base-content/60">
					{new Date(selectedTransaction.date).toLocaleDateString('id-ID')}
				</p>
			</div>

			<div class="modal-action">
				<button
					class="btn btn-ghost"
					onclick={() => {
						showDeleteModal = false;
						selectedTransaction = null;
					}}
				>
					Batal
				</button>
				<form
					method="POST"
					action="?/delete"
					use:enhance={() => {
						return async ({ result, update }: any) => {
							showDeleteModal = false;
							selectedTransaction = null;
							if (result.type === 'success') {
								toastSuccess('Transaksi berhasil dihapus');
								await update();
							} else if (result.type === 'failure') {
								toastError(result.data?.message || 'Gagal menghapus');
							}
						};
					}}
				>
					<input type="hidden" name="id" value={selectedTransaction.id} />
					<button type="submit" class="btn btn-error">
						<Trash2 class="w-4 h-4" />
						Hapus
					</button>
				</form>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button
				onclick={() => {
					showDeleteModal = false;
					selectedTransaction = null;
				}}>close</button
			>
		</form>
	</dialog>
{/if}
