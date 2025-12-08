<script lang="ts">
	import { enhance } from '$app/forms';
	import { superForm } from 'sveltekit-superforms';
	import { Badge, Toast, success as toastSuccess, error as toastError } from '$lib/components/ui';
	import {
		Plus,
		Search,
		Download,
		Box,
		Wrench,
		History,
		SquarePen,
		Trash2,
		Package,
		DollarSign,
		Image as ImageIcon,
		CheckCircle
	} from 'lucide-svelte';
	import { page } from '$app/state';

	// View state
	let activeTab = $state('assets'); // assets, lending, maintenance
	let searchQuery = $state('');
	let selectedCategory = $state('');
	let selectedCondition = $state('');

	// SuperForms
	const {
		form: lendingFormData,
		errors: lendingErrors,
		enhance: lendingEnhance,
		delayed: lendingDelayed
	} = superForm(page.data.lendingForm, {
		id: 'lendingForm',
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toastSuccess('Peminjaman berhasil dicatat');
				showLendingModal = false;
			} else if (result.type === 'failure') {
				toastError('Gagal mencatat peminjaman');
			}
		}
	});

	const {
		form: maintenanceFormData,
		errors: maintenanceErrors,
		enhance: maintenanceEnhance,
		delayed: maintenanceDelayed
	} = superForm(page.data.maintenanceForm, {
		id: 'maintenanceForm',
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toastSuccess('Maintenance berhasil dijadwalkan');
				showMaintenanceModal = false;
			} else if (result.type === 'failure') {
				toastError('Gagal menjadwalkan maintenance');
			}
		}
	});

	// Modal states
	let showDeleteModal = $state(false);
	let showLendingModal = $state(false);
	let showMaintenanceModal = $state(false);
	let selectedAsset = $state<(typeof page.data.assets)[0] | null>(null);

	// Filtered assets
	const filteredAssets = $derived(() => {
		let result = page.data.assets || [];
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(a: { name: string; code: string; location?: string }) =>
					a.name.toLowerCase().includes(q) ||
					a.code.toLowerCase().includes(q) ||
					(a.location && a.location.toLowerCase().includes(q))
			);
		}
		if (selectedCategory)
			result = result.filter((a: { category: string }) => a.category === selectedCategory);
		if (selectedCondition)
			result = result.filter((a: { condition: string }) => a.condition === selectedCondition);
		return result;
	});

	function formatCurrency(amount: any) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(Number(amount) || 0);
	}

	function getConditionBadge(condition: string) {
		const map: Record<string, string> = {
			good: 'success',
			maintenance: 'warning',
			damaged: 'error',
			lost: 'ghost'
		};
		return map[condition] || 'ghost';
	}

	function getConditionLabel(condition: string) {
		const map: Record<string, string> = {
			good: 'Baik',
			maintenance: 'Perbaikan',
			damaged: 'Rusak',
			lost: 'Hilang'
		};
		return map[condition] || condition;
	}

	// Delete Asset Logic
	function openDelete(asset: (typeof page.data.assets)[0]) {
		selectedAsset = asset;
		showDeleteModal = true;
	}

	function handleDelete() {
		return async ({ result, update }: any) => {
			showDeleteModal = false;
			selectedAsset = null;
			if (result.type === 'success') {
				toastSuccess('Aset berhasil dihapus');
				await update();
			} else if (result.type === 'failure') {
				toastError(result.data?.message || 'Gagal menghapus');
			}
		};
	}

	// Return Lending Logic
	function handleReturn() {
		return async ({ result, update }: any) => {
			if (result.type === 'success') {
				toastSuccess('Aset dikembalikan');
				await update();
			} else {
				toastError(result.data?.message || 'Gagal');
			}
		};
	}

	// Complete Maintenance Logic
	function handleCompleteMaintenance() {
		return async ({ result, update }: any) => {
			if (result.type === 'success') {
				toastSuccess('Maintenance selesai');
				await update();
			} else {
				toastError(result.data?.message || 'Gagal');
			}
		};
	}
</script>

<svelte:head>
	<title>Inventaris | TadBeer</title>
</svelte:head>

<Toast />

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold">📦 Inventaris</h1>
			<p class="text-base-content/60 mt-1">Manajemen aset dan perlengkapan masjid</p>
		</div>
		<div class="flex gap-2">
			<form method="POST" action="?/exportCSV" use:enhance>
				<button type="submit" class="btn btn-ghost btn-sm">
					<Download class="w-4 h-4" />
					Export
				</button>
			</form>
			<a href="/admin/inventaris/tambah" class="btn btn-primary btn-sm">
				<Plus class="w-4 h-4" />
				Tambah Aset
			</a>
		</div>
	</div>

	<!-- Stats -->
	<div class="stats stats-vertical sm:stats-horizontal shadow w-full">
		<div class="stat">
			<div class="stat-figure text-primary"><Package class="w-8 h-8" /></div>
			<div class="stat-title">Total Aset</div>
			<div class="stat-value text-xl">{page.data.stats.totalAssets}</div>
			<div class="stat-desc">Unit barang</div>
		</div>
		<div class="stat">
			<div class="stat-figure text-success"><DollarSign class="w-8 h-8" /></div>
			<div class="stat-title">Total Nilai</div>
			<div class="stat-value text-xl text-success">
				{formatCurrency(page.data.stats.totalValue)}
			</div>
			<div class="stat-desc">Estimasi nilai aset</div>
		</div>
		<div class="stat">
			<div class="stat-figure text-warning"><Box class="w-8 h-8" /></div>
			<div class="stat-title">Dipinjam</div>
			<div class="stat-value text-xl text-warning">{page.data.stats.borrowed}</div>
			<div class="stat-desc">Sedang dipinjam</div>
		</div>
		<div class="stat">
			<div class="stat-figure text-error"><Wrench class="w-8 h-8" /></div>
			<div class="stat-title">Perbaikan</div>
			<div class="stat-value text-xl text-error">{page.data.stats.inMaintenance}</div>
			<div class="stat-desc">Dalam maintenance</div>
		</div>
	</div>

	<!-- Tabs -->
	<div role="tablist" class="tabs tabs-bordered">
		<button
			role="tab"
			class="tab {activeTab === 'assets' ? 'tab-active' : ''}"
			onclick={() => (activeTab = 'assets')}
		>
			<Box class="w-4 h-4 mr-2" /> Daftar Aset
		</button>
		<button
			role="tab"
			class="tab {activeTab === 'lending' ? 'tab-active' : ''}"
			onclick={() => (activeTab = 'lending')}
		>
			<History class="w-4 h-4 mr-2" /> Peminjaman
		</button>
		<button
			role="tab"
			class="tab {activeTab === 'maintenance' ? 'tab-active' : ''}"
			onclick={() => (activeTab = 'maintenance')}
		>
			<Wrench class="w-4 h-4 mr-2" /> Maintenance
		</button>
	</div>

	{#if activeTab === 'assets'}
		<!-- Assets Content -->
		<div class="space-y-4">
			<!-- Filters -->
			<div class="flex flex-wrap gap-3 items-center">
				<div class="flex-1 min-w-[200px]">
					<label class="input input-bordered input-sm flex items-center gap-2 w-full">
						<Search class="w-4 h-4 text-base-content/50" />
						<input
							type="text"
							placeholder="Cari nama, kode, lokasi..."
							class="grow"
							bind:value={searchQuery}
						/>
					</label>
				</div>
				<select class="select select-bordered select-sm" bind:value={selectedCategory}>
					<option value="">Semua Kategori</option>
					<option value="Elektronik">Elektronik</option>
					<option value="Furniture">Furniture</option>
					<option value="Perlengkapan">Perlengkapan</option>
					<option value="Kendaraan">Kendaraan</option>
					<option value="Lainnya">Lainnya</option>
				</select>
				<select class="select select-bordered select-sm" bind:value={selectedCondition}>
					<option value="">Semua Kondisi</option>
					<option value="good">Baik</option>
					<option value="maintenance">Perbaikan</option>
					<option value="damaged">Rusak</option>
					<option value="lost">Hilang</option>
				</select>
			</div>

			<!-- Assets Table -->
			<div class="card bg-base-100 shadow-sm">
				<div class="card-body p-0">
					<div class="overflow-x-auto">
						<table class="table">
							<thead>
								<tr>
									<th>Aset</th>
									<th>Kategori</th>
									<th>Lokasi</th>
									<th>Jumlah</th>
									<th>Kondisi</th>
									<th class="text-center">Aksi</th>
								</tr>
							</thead>
							<tbody>
								{#each filteredAssets() as asset (asset.id)}
									<tr class="hover:bg-base-200/50">
										<td>
											<div class="flex items-center gap-3">
												<div class="avatar rounded-lg {asset.imageUrl ? '' : 'placeholder'}">
													{#if asset.imageUrl}
														<div class="w-12 h-12 rounded-lg">
															<img src={asset.imageUrl} alt={asset.name} />
														</div>
													{:else}
														<div
															class="bg-base-200 text-base-content/50 rounded-lg w-12 h-12 flex items-center justify-center"
														>
															<ImageIcon class="w-6 h-6" />
														</div>
													{/if}
												</div>
												<div>
													<div class="font-medium">{asset.name}</div>
													<div class="text-xs text-base-content/50">{asset.code}</div>
												</div>
											</div>
										</td>
										<td>{asset.category}</td>
										<td>{asset.location}</td>
										<td>{asset.quantity} Unit</td>
										<td>
											<Badge variant={getConditionBadge(asset.condition) as any} size="sm">
												{getConditionLabel(asset.condition)}
											</Badge>
										</td>
										<td>
											<div class="flex justify-center gap-1">
												<a
													href="/admin/inventaris/{asset.id}/edit"
													class="btn btn-ghost btn-xs btn-square"
												>
													<SquarePen class="w-4 h-4" />
												</a>
												<button
													class="btn btn-ghost btn-xs btn-square text-error"
													onclick={() => openDelete(asset)}
												>
													<Trash2 class="w-4 h-4" />
												</button>
											</div>
										</td>
									</tr>
								{:else}
									<tr>
										<td colspan="6" class="text-center py-12 text-base-content/50">
											<p class="text-4xl mb-2">📦</p>
											<p>Tidak ada data aset</p>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	{:else if activeTab === 'lending'}
		<div class="space-y-4">
			<div class="flex justify-between items-center">
				<div class="form-control">
					<label class="input input-bordered input-sm flex items-center gap-2">
						<Search class="w-4 h-4 text-base-content/50" />
						<input type="text" placeholder="Cari peminjam..." class="grow" />
					</label>
				</div>
				<button class="btn btn-primary btn-sm" onclick={() => (showLendingModal = true)}>
					<Plus class="w-4 h-4" /> Catat Peminjaman
				</button>
			</div>

			<div class="card bg-base-100 shadow-sm">
				<div class="card-body p-0">
					<div class="overflow-x-auto">
						<table class="table">
							<thead>
								<tr>
									<th>Aset</th>
									<th>Peminjam</th>
									<th>Tanggal Pinjam</th>
									<th>Status</th>
									<th class="text-center">Aksi</th>
								</tr>
							</thead>
							<tbody>
								{#each page.data.lendings as lending (lending.id)}
									<tr class="hover:bg-base-200/50">
										<td class="font-medium">
											<div>{lending.assetName}</div>
											<div class="text-xs text-base-content/60">{lending.assetCode}</div>
										</td>
										<td>
											<div>{lending.borrowerName}</div>
											<!--<div class="text-xs text-base-content/60">{lending.borrowerContact}</div>-->
										</td>
										<td>
											<div class="text-sm">
												{lending.borrowDate
													? new Date(lending.borrowDate).toLocaleDateString('id-ID')
													: '-'}
											</div>
											{#if lending.returnDate}
												<div class="text-xs text-base-content/50">
													Kembali: {new Date(lending.returnDate).toLocaleDateString('id-ID')}
												</div>
											{/if}
										</td>
										<td>
											<Badge
												variant={lending.status === 'returned' ? 'success' : 'warning'}
												size="sm"
											>
												{lending.status === 'returned' ? 'Dikembalikan' : 'Dipinjam'}
											</Badge>
										</td>
										<td>
											<div class="flex justify-center gap-1">
												{#if lending.status === 'borrowed'}
													<form method="POST" action="?/returnLending" use:enhance={handleReturn}>
														<input type="hidden" name="id" value={lending.id} />
														<button class="btn btn-ghost btn-xs text-primary" title="Kembalikan">
															<CheckCircle class="w-4 h-4" /> Kembalikan
														</button>
													</form>
												{:else}
													<span class="text-base-content/50 italic">Dikembalikan</span>
												{/if}
											</div>
										</td>
									</tr>
								{:else}
									<tr>
										<td colspan="5" class="text-center py-12 text-base-content/50">
											Tidak ada riwayat peminjaman
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	{:else if activeTab === 'maintenance'}
		<div class="space-y-4">
			<div class="flex justify-between items-center">
				<div class="form-control">
					<label class="input input-bordered input-sm flex items-center gap-2">
						<Search class="w-4 h-4 text-base-content/50" />
						<input type="text" placeholder="Cari log..." class="grow" />
					</label>
				</div>
				<button class="btn btn-primary btn-sm" onclick={() => (showMaintenanceModal = true)}>
					<Plus class="w-4 h-4" /> Catat Maintenance
				</button>
			</div>

			<div class="card bg-base-100 shadow-sm">
				<div class="card-body p-0">
					<div class="overflow-x-auto">
						<table class="table">
							<thead>
								<tr>
									<th>Aset</th>
									<th>Tanggal</th>
									<th>Deskripsi</th>
									<th>Biaya</th>
									<th>Status</th>
									<th>Aksi</th>
								</tr>
							</thead>
							<tbody>
								{#each page.data.maintenance as log (log.id)}
									<tr class="hover:bg-base-200/50">
										<td class="font-medium">{log.assetName}</td>
										<td
											>{log.maintenanceDate
												? new Date(log.maintenanceDate).toLocaleDateString('id-ID')
												: '-'}</td
										>
										<td>{log.description}</td>
										<td>{formatCurrency(log.cost)}</td>
										<td>
											<Badge variant={log.status === 'completed' ? 'success' : 'info'} size="sm">
												{log.status === 'completed' ? 'Selesai' : 'Terjadwal'}
											</Badge>
										</td>
										<td>
											{#if log.status !== 'completed' && log.status !== 'cancelled'}
												<form
													method="POST"
													action="?/completeMaintenance"
													use:enhance={handleCompleteMaintenance}
												>
													<input type="hidden" name="id" value={log.id} />
													<button class="btn btn-ghost btn-xs text-success" title="Selesai">
														<CheckCircle class="w-4 h-4" />
													</button>
												</form>
											{:else}
												<span class="text-base-content/50 italic">Selesai</span>
											{/if}
										</td>
									</tr>
								{:else}
									<tr>
										<td colspan="6" class="text-center py-12 text-base-content/50">
											Tidak ada riwayat maintenance
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Logging Modal (Peminjaman) -->
<dialog class="modal {showLendingModal ? 'modal-open' : ''}">
	<div class="modal-box">
		<h3 class="font-bold text-lg mb-4">Catat Peminjaman</h3>
		<form method="POST" action="?/createLending" use:lendingEnhance>
			<div class="space-y-4">
				<div class="form-control">
					<label for="assetId" class="label">Aset</label>
					<select
						name="assetId"
						class="select select-bordered w-full"
						bind:value={$lendingFormData.assetId}
					>
						<option value={0}>Pilih Aset</option>
						{#each page.data.assetsgood as asset}
							<option value={asset.id}>{asset.name} ({asset.code})</option>
						{/each}
					</select>
					{#if $lendingErrors.assetId}<span class="text-error text-xs"
							>{$lendingErrors.assetId}</span
						>{/if}
				</div>
				<div class="form-control">
					<label for="borrowerName" class="label">Nama Peminjam</label>
					<input
						type="text"
						name="borrowerName"
						class="input input-bordered w-full"
						bind:value={$lendingFormData.borrowerName}
					/>
					{#if $lendingErrors.borrowerName}<span class="text-error text-xs"
							>{$lendingErrors.borrowerName}</span
						>{/if}
				</div>
				<div class="form-control">
					<label for="borrowerContact" class="label">Kontak (HP/WA)</label>
					<input
						type="text"
						name="borrowerContact"
						class="input input-bordered w-full"
						bind:value={$lendingFormData.borrowerContact}
					/>
				</div>
				<div class="form-control">
					<label for="borrowDate" class="label">Tanggal Pinjam</label>
					<input
						type="date"
						name="borrowDate"
						class="input input-bordered w-full"
						bind:value={$lendingFormData.borrowDate}
					/>
				</div>
				<div class="form-control">
					<label for="notes" class="label">Catatan</label>
					<textarea
						name="notes"
						class="textarea textarea-bordered w-full"
						bind:value={$lendingFormData.notes}
					></textarea>
				</div>
			</div>
			<div class="modal-action">
				<button type="button" class="btn btn-ghost" onclick={() => (showLendingModal = false)}
					>Batal</button
				>
				<button type="submit" class="btn btn-primary" disabled={$lendingDelayed}>Simpan</button>
			</div>
		</form>
	</div>
</dialog>

<!-- Maintenance Modal -->
<dialog class="modal {showMaintenanceModal ? 'modal-open' : ''}">
	<div class="modal-box">
		<h3 class="font-bold text-lg mb-4">Catat Maintenance</h3>
		<form method="POST" action="?/createMaintenance" use:maintenanceEnhance>
			<div class="space-y-4">
				<div class="form-control">
					<label for="assetId" class="label">Aset</label>
					<select
						name="assetId"
						class="select select-bordered w-full"
						bind:value={$maintenanceFormData.assetId}
					>
						<option value={0}>Pilih Aset</option>
						{#each page.data.assetsmaintenance as asset}
							<option value={asset.id}>{asset.name} ({asset.code})</option>
						{/each}
					</select>
					{#if $maintenanceErrors.assetId}<span class="text-error text-xs"
							>{$maintenanceErrors.assetId}</span
						>{/if}
				</div>
				<div class="form-control">
					<label for="description" class="label">Deskripsi Kerusakan/Maintenance</label>
					<input
						type="text"
						name="description"
						class="input input-bordered w-full"
						bind:value={$maintenanceFormData.description}
					/>
					{#if $maintenanceErrors.description}<span class="text-error text-xs"
							>{$maintenanceErrors.description}</span
						>{/if}
				</div>
				<div class="form-control">
					<label for="maintenanceDate" class="label">Tanggal</label>
					<input
						type="date"
						name="maintenanceDate"
						class="input input-bordered w-full"
						bind:value={$maintenanceFormData.maintenanceDate}
					/>
					{#if $maintenanceErrors.maintenanceDate}
						<span class="text-error text-xs">
							{$maintenanceErrors.maintenanceDate}
						</span>{/if}
				</div>
				<div class="form-control">
					<label for="status" class="label">Status</label>
					<select
						name="status"
						class="select select-bordered w-full"
						bind:value={$maintenanceFormData.status}
					>
						<option value="scheduled">Terjadwal</option>
						<option value="in_progress">Sedang Dikerjakan</option>
						<option value="completed">Selesai</option>
					</select>
				</div>
				<div class="form-control">
					<label for="performer" class="label">Pelaksana (Teknisi/Vendor)</label>
					<input
						type="text"
						name="performer"
						class="input input-bordered w-full"
						bind:value={$maintenanceFormData.performer}
					/>
				</div>
				<div class="form-control">
					<label for="cost" class="label">Estimasi Biaya</label>
					<div class="input-group">
						<span class="bg-base-200 px-3 py-2 border rounded-l-lg flex items-center">Rp</span>
						<input
							type="number"
							name="cost"
							class="input input-bordered w-full rounded-l-none"
							bind:value={$maintenanceFormData.cost}
						/>
					</div>
				</div>
			</div>
			<div class="modal-action">
				<button type="button" class="btn btn-ghost" onclick={() => (showMaintenanceModal = false)}
					>Batal</button
				>
				<button type="submit" class="btn btn-primary" disabled={$maintenanceDelayed}>Simpan</button>
			</div>
		</form>
	</div>
</dialog>

<!-- Delete Modal -->
{#if showDeleteModal && selectedAsset}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg text-error">⚠️ Hapus Aset</h3>
			<p class="py-4">Apakah Anda yakin ingin menghapus aset ini?</p>
			<div class="bg-base-200 rounded-lg p-4 mb-4">
				<div class="flex items-center gap-3">
					<div class="avatar rounded-lg {selectedAsset.imageUrl ? '' : 'placeholder'}">
						{#if selectedAsset.imageUrl}
							<div class="w-12 h-12 rounded-lg">
								<img src={selectedAsset.imageUrl} alt={selectedAsset.name} />
							</div>
						{:else}
							<div class="bg-base-300 text-base-content/50 rounded-lg w-12 h-12">
								<ImageIcon class="w-6 h-6" />
							</div>
						{/if}
					</div>
					<div>
						<p class="font-medium">{selectedAsset.name}</p>
						<p class="text-sm text-base-content/60">{selectedAsset.code}</p>
					</div>
				</div>
			</div>
			<div class="modal-action">
				<button
					class="btn btn-ghost"
					onclick={() => {
						showDeleteModal = false;
						selectedAsset = null;
					}}>Batal</button
				>
				<form method="POST" action="?/deleteAsset" use:enhance={() => handleDelete()}>
					<input type="hidden" name="id" value={selectedAsset.id} />
					<button type="submit" class="btn btn-error"><Trash2 class="w-4 h-4" /> Hapus</button>
				</form>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button
				onclick={() => {
					showDeleteModal = false;
					selectedAsset = null;
				}}>close</button
			>
		</form>
	</dialog>
{/if}
