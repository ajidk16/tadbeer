<script lang="ts">
	import { enhance } from '$app/forms';
	import { Badge, Toast, success as toastSuccess, error as toastError } from '$lib/components/ui';
	import { Plus, Download, Eye, SquarePen, Trash2, X } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let { data, form } = $props();

	// Filter states
	let searchQuery = $state('');
	let selectedCategory = $state('');

	// Modal states
	let showDetailModal = $state(false);
	let showDeleteModal = $state(false);
	let selectedTransaction = $state<(typeof data.transactions)[0] | null>(null);
	let isDeleting = $state(false);
	let lastFormId = $state<string | null>(null);

	// Show toast on form result (only once per form submission)
	onMount(() => {
		const formId = form?.success ? 'success' : form?.error ? 'error' : null;
		if (formId && formId !== lastFormId) {
			lastFormId = formId;
			if (form?.success) {
				toastSuccess(form.message || 'Berhasil!');
			} else if (form?.error) {
				toastError(form.error);
			}
		}
	});

	// Format currency
	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(value);
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

	const totalAmount = $derived(filteredTransactions().reduce((sum, tx) => sum + tx.amount, 0));

	function openDetail(tx: (typeof data.transactions)[0]) {
		selectedTransaction = tx;
		showDetailModal = true;
	}

	function openDelete(tx: (typeof data.transactions)[0]) {
		selectedTransaction = tx;
		showDeleteModal = true;
	}

	function handleDelete() {
		return async ({ result, update }: any) => {
			isDeleting = false;
			showDeleteModal = false;
			selectedTransaction = null;

			if (result.type === 'success') {
				toastSuccess('Transaksi berhasil dihapus');
				await update();
			} else if (result.type === 'failure') {
				toastError(result.data?.error || 'Gagal menghapus');
			}
		};
	}
</script>

<svelte:head>
	<title>Pengeluaran | Keuangan | MiniMasjid</title>
</svelte:head>

<Toast />

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold">💸 Pengeluaran</h1>
			<p class="text-base-content/60 mt-1">Kelola data pengeluaran masjid</p>
		</div>
		<a href="/keuangan/pengeluaran/tambah" class="btn btn-error">
			<Plus class="w-4 h-4" />
			Tambah Pengeluaran
		</a>
	</div>

	<!-- Stats Summary -->
	<div class="stats stats-vertical sm:stats-horizontal shadow w-full">
		<div class="stat">
			<div class="stat-title">Total Pengeluaran</div>
			<div class="stat-value text-error text-xl">{formatCurrency(data.totalExpense || 0)}</div>
			<div class="stat-desc">Bulan ini</div>
		</div>
		<div class="stat">
			<div class="stat-title">Jumlah Transaksi</div>
			<div class="stat-value text-xl">{data.transactionCount || 0}</div>
			<div class="stat-desc">transaksi</div>
		</div>
		<div class="stat">
			<div class="stat-title">Terbesar</div>
			<div class="stat-value text-xl">{formatCurrency(data.largestExpense || 0)}</div>
			<div class="stat-desc">single transaction</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="flex flex-wrap gap-3 items-center">
		<div class="flex-1 min-w-[200px]">
			<input
				type="text"
				placeholder="Cari transaksi..."
				class="input input-bordered input-sm w-full"
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
				<li><button>Excel (.xlsx)</button></li>
				<li><button>PDF</button></li>
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
									<span class="font-mono text-error font-medium">
										-{formatCurrency(tx.amount)}
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
										<a
											href="/keuangan/pengeluaran/{tx.id}/edit"
											class="btn btn-ghost btn-xs btn-square"
											title="Edit"
										>
											<SquarePen class="w-4 h-4" />
										</a>
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
										<p>Tidak ada data pengeluaran</p>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
					{#if filteredTransactions().length > 0}
						<tfoot>
							<tr class="bg-base-200/50">
								<td colspan="3" class="font-semibold">Total</td>
								<td class="text-right font-mono text-error font-bold">
									-{formatCurrency(totalAmount)}
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
						<Badge variant="error">{selectedTransaction.category}</Badge>
					</div>
				</div>

				<div>
					<p class="text-sm text-base-content/60">Keterangan</p>
					<p class="font-medium">{selectedTransaction.description}</p>
				</div>

				<div>
					<p class="text-sm text-base-content/60">Jumlah</p>
					<p class="text-2xl font-bold text-error">
						-{formatCurrency(selectedTransaction.amount)}
					</p>
				</div>

				{#if selectedTransaction.notes}
					<div>
						<p class="text-sm text-base-content/60">Catatan</p>
						<p class="text-sm bg-base-200 rounded-lg p-3">{selectedTransaction.notes}</p>
					</div>
				{/if}
			</div>

			<div class="modal-action">
				<a
					href="/keuangan/pengeluaran/{selectedTransaction.id}/edit"
					class="btn btn-primary btn-sm"
				>
					<SquarePen class="w-4 h-4" />
					Edit
				</a>
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
				<p class="text-error font-mono">-{formatCurrency(selectedTransaction.amount)}</p>
				<p class="text-sm text-base-content/60">
					{new Date(selectedTransaction.date).toLocaleDateString('id-ID')}
				</p>
			</div>

			<p class="text-sm text-base-content/60">Tindakan ini tidak dapat dibatalkan.</p>

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
						isDeleting = true;
						return handleDelete();
					}}
				>
					<input type="hidden" name="id" value={selectedTransaction.id} />
					<button type="submit" class="btn btn-error" disabled={isDeleting}>
						{#if isDeleting}
							<span class="loading loading-spinner loading-sm"></span>
						{:else}
							<Trash2 class="w-4 h-4" />
						{/if}
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
