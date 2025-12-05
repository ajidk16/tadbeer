<script lang="ts">
	import { DataTable, Badge } from '$lib/components/ui';
	import { Plus, Download, Filter, Eye, SquarePen, Trash2 } from 'lucide-svelte';

	let { data } = $props();

	// Filter states
	let searchQuery = $state('');
	let selectedCategory = $state('');
	let selectedMonth = $state('');

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

	// Total amount
	const totalAmount = $derived(filteredTransactions().reduce((sum, tx) => sum + tx.amount, 0));
</script>

<svelte:head>
	<title>Pemasukan | Keuangan | MiniMasjid</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold">💰 Pemasukan</h1>
			<p class="text-base-content/60 mt-1">Kelola data pemasukan masjid</p>
		</div>
		<a href="/keuangan/pemasukan/tambah" class="btn btn-primary">
			<Plus class="w-4 h-4" />
			Tambah Pemasukan
		</a>
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
		<select class="select select-bordered select-sm" bind:value={selectedMonth}>
			<option value="">Bulan Ini</option>
			<option value="last">Bulan Lalu</option>
			<option value="3">3 Bulan</option>
		</select>
		<div class="dropdown dropdown-end">
			<button class="btn btn-ghost btn-sm">
				<Download class="w-4 h-4" />
				Export
			</button>
			<ul class="dropdown-content menu bg-base-100 rounded-box shadow-lg z-10 w-40 p-2">
				<li><button>Excel (.xlsx)</button></li>
				<li><button>PDF</button></li>
				<li><button>CSV</button></li>
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
										+{formatCurrency(tx.amount)}
									</span>
								</td>
								<td>
									<div class="flex justify-center gap-1">
										<a
											href="/keuangan/pemasukan/{tx.id}"
											class="btn btn-ghost btn-xs btn-square"
											title="Lihat Detail"
										>
											<Eye class="w-4 h-4" />
										</a>
										<a
											href="/keuangan/pemasukan/{tx.id}/edit"
											class="btn btn-ghost btn-xs btn-square"
											title="Edit"
										>
											<SquarePen class="w-4 h-4" />
										</a>
										<button class="btn btn-ghost btn-xs btn-square text-error" title="Hapus">
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

	<!-- Pagination -->
	{#if data.totalPages > 1}
		<div class="flex justify-center">
			<div class="join">
				<button class="join-item btn btn-sm" disabled={data.currentPage === 1}>«</button>
				{#each Array(data.totalPages) as _, i}
					<button class="join-item btn btn-sm" class:btn-active={data.currentPage === i + 1}>
						{i + 1}
					</button>
				{/each}
				<button class="join-item btn btn-sm" disabled={data.currentPage === data.totalPages}
					>»</button
				>
			</div>
		</div>
	{/if}
</div>
