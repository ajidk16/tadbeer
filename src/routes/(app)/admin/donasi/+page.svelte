<script lang="ts">
	import { Badge, Toast, success as toastSuccess, error as toastError } from '$lib/components/ui';
	import { enhance as svelteEnhance } from '$app/forms';
	import { superForm } from 'sveltekit-superforms';
	import {
		Plus,
		Heart,
		DollarSign,
		Users,
		TrendingUp,
		Share2,
		Copy,
		Trash2,
		ExternalLink,
		CreditCard,
		Wallet,
		QrCode,
		Clock,
		SquarePen,
		X
	} from 'lucide-svelte';
	import { page } from '$app/state';

	const { form, errors, enhance, constraints, message, delayed } = superForm(page.data.form, {
		delayMs: 0, // Show loading indicator immediately
		timeoutMs: 8000, // 8s timeout
		onResult: ({ result }) => {
			if (showCampaignModal) {
				// Close modal on success
				if (result.type === 'success') {
					toastSuccess(isEditMode ? 'Program diperbarui' : 'Program donasi berhasil dibuat');
					showCampaignModal = false;
				} else if (result.type === 'failure') {
					// Server returns { form, message: '...' } on failure
					toastError(result.data?.message || 'Gagal menyimpan');
				}
			} else {
				if (result.type === 'success') {
					toastSuccess('Data berhasil dihapus');
					showDeleteModal = false;
				} else {
					toastError('Gagal menghapus');
				}
			}
		}
	});

	// View state
	let activeTab = $state('campaigns'); // campaigns, transactions

	// Modal states
	let showCampaignModal = $state(false);
	let showDeleteModal = $state(false);
	let selectedItem = $state<any>(null);
	let isEditMode = $state(false);

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(amount);
	}

	function formatDate(dateStr: string) {
		if (!dateStr) return '-';
		return new Date(dateStr).toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	function getProgress(collected: number, target: number) {
		if (!target) return 0;
		return Math.min(Math.round((collected / target) * 100), 100);
	}

	let formTargetFormatted = $state('');

	function formatTargetInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const value = input.value.replace(/\D/g, '');
		$form.target = Number(value); // Update form store directly
		formTargetFormatted = value ? new Intl.NumberFormat('id-ID').format(Number(value)) : '';
		input.value = formTargetFormatted;
	}

	function copyLink(id: string) {
		const url = `${window.location.origin}/donasi/${id}`;
		// Fallback for clipboard API in some envs, but standard is fine
		navigator.clipboard
			.writeText(url)
			.then(() => {
				toastSuccess('Link donasi berhasil disalin');
			})
			.catch(() => {
				toastError('Gagal menyalin link');
			});
	}

	function openCampaignModal() {
		selectedItem = null;
		isEditMode = false;
		// Reset form
		$form.id = undefined;
		$form.title = 'bantuan korban banjir sumatra';
		// $form.target = 0;
		formTargetFormatted = new Intl.NumberFormat('id-ID').format(10000000000);
		$form.deadline = '';
		$form.description = '';
		showCampaignModal = true;
	}

	function openEditCampaign(item: any) {
		selectedItem = item;
		isEditMode = true;

		$form.id = item.id;
		$form.title = item.title;
		// $form.target = item.target;
		formTargetFormatted = new Intl.NumberFormat('id-ID').format(item.target);
		$form.deadline = item.deadline; // Already YYYY-MM-DD from server transform
		$form.description = item.description || '';

		showCampaignModal = true;
	}

	function openDelete(item: any) {
		selectedItem = item;
		$form.id = item.id;

		showDeleteModal = true;
	}

	function handleDelete() {
		return async ({ result, update }: any) => {
			showDeleteModal = false;
			if (result.type === 'success') {
				toastSuccess('Data berhasil dihapus');
				await update();
			} else {
				toastError('Gagal menghapus');
			}
		};
	}
</script>

<svelte:head>
	<title>Donasi | TadBeer</title>
</svelte:head>

<!-- <Toast /> -->

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold">💝 Donasi Online</h1>
			<p class="text-base-content/60 mt-1">Kelola program donasi dan infaq</p>
		</div>
		<button class="btn btn-primary btn-sm" onclick={openCampaignModal}>
			<Plus class="w-4 h-4" /> Buat Program
		</button>
	</div>

	<!-- Stats -->
	<div class="stats stats-vertical sm:stats-horizontal shadow w-full">
		<div class="stat">
			<div class="stat-figure text-primary"><DollarSign class="w-8 h-8" /></div>
			<div class="stat-title">Total Terkumpul</div>
			<div class="stat-value text-xl text-primary">
				{formatCurrency(page.data.stats.totalCollected)}
			</div>
			<div class="stat-desc">Semua program</div>
		</div>
		<div class="stat">
			<div class="stat-figure text-secondary"><Heart class="w-8 h-8" /></div>
			<div class="stat-title">Program Aktif</div>
			<div class="stat-value text-xl">{page.data.stats.activeCampaigns}</div>
			<div class="stat-desc">Sedang berjalan</div>
		</div>
		<div class="stat">
			<div class="stat-figure text-accent"><Users class="w-8 h-8" /></div>
			<div class="stat-title">Total Donatur</div>
			<div class="stat-value text-xl">{page.data.stats.totalDonors}</div>
			<div class="stat-desc">Orang berdonasi</div>
		</div>
	</div>

	<!-- Tabs -->
	<div role="tablist" class="tabs tabs-bordered">
		<button
			role="tab"
			class="tab {activeTab === 'campaigns' ? 'tab-active' : ''}"
			onclick={() => (activeTab = 'campaigns')}
		>
			<Heart class="w-4 h-4 mr-2" /> Program Donasi
		</button>
		<button
			role="tab"
			class="tab {activeTab === 'transactions' ? 'tab-active' : ''}"
			onclick={() => (activeTab = 'transactions')}
		>
			<DollarSign class="w-4 h-4 mr-2" /> Riwayat Transaksi
		</button>
	</div>

	{#if activeTab === 'campaigns'}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each page.data.campaigns as campaign}
				<div class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
					<div class="card-body p-4">
						<div class="flex justify-between items-start mb-2">
							<Badge variant={campaign.status === 'active' ? 'success' : 'ghost'} size="sm">
								{campaign.status === 'active' ? 'Aktif' : 'Selesai'}
							</Badge>
							<div class="dropdown dropdown-end">
								<button class="btn btn-ghost btn-xs btn-square">⋮</button>
								<ul class="dropdown-content menu bg-base-100 rounded-box shadow z-10 w-40 p-1">
									<li>
										<button onclick={() => copyLink(campaign.id.toString())}
											><Copy class="w-4 h-4" /> Salin Link</button
										>
									</li>
									<li>
										<button onclick={() => openEditCampaign(campaign)}
											><SquarePen class="w-4 h-4" /> Edit</button
										>
									</li>
									<li>
										<button class="text-error" onclick={() => openDelete(campaign)}
											><Trash2 class="w-4 h-4" /> Hapus</button
										>
									</li>
								</ul>
							</div>
						</div>

						<h3 class="font-bold text-lg mb-1">{campaign.title}</h3>
						<div class="text-sm text-base-content/60 mb-4">
							<div class="flex items-center gap-1">
								<Users class="w-3 h-3" />
								{campaign.donors} Donatur
							</div>
							<div class="flex items-center gap-1">
								<Clock class="w-3 h-3" /> Berakhir {formatDate(campaign.deadline)}
							</div>
						</div>

						<div class="space-y-2">
							<div class="flex justify-between text-sm">
								<span class="font-medium text-primary">{formatCurrency(campaign.collected)}</span>
								<span class="text-base-content/50">dari {formatCurrency(campaign.target)}</span>
							</div>
							<progress
								class="progress progress-primary w-full"
								value={getProgress(campaign.collected, campaign.target)}
								max="100"
							></progress>
							<div class="text-right text-xs font-medium">
								{getProgress(campaign.collected, campaign.target)}%
							</div>
						</div>

						<div class="card-actions justify-end mt-4 pt-4 border-t border-base-200">
							<button
								class="btn btn-sm btn-outline btn-primary w-full"
								onclick={() => copyLink(campaign.id.toString())}
							>
								<Share2 class="w-4 h-4" /> Bagikan
							</button>
						</div>
					</div>
				</div>
			{:else}
				<div class="col-span-3 text-center py-12 text-base-content/50">
					<p class="text-4xl mb-2">💝</p>
					<p>Belum ada program donasi</p>
				</div>
			{/each}
		</div>
	{:else if activeTab === 'transactions'}
		<div class="card bg-base-100 shadow-sm">
			<div class="card-body p-0">
				<div class="overflow-x-auto">
					<table class="table">
						<thead>
							<tr>
								<th>Donatur</th>
								<th>Program</th>
								<th>Jumlah</th>
								<th>Metode</th>
								<th>Status</th>
							</tr>
						</thead>
						<tbody>
							{#each page.data.transactions as trx}
								<tr class="hover:bg-base-200/50">
									<td>
										<div class="font-medium">{trx.donorName}</div>
										<div class="text-xs text-base-content/50">{formatDate(trx.date)}</div>
									</td>
									<td class="max-w-[200px] truncate" title={trx.campaign}>{trx.campaign}</td>
									<td class="font-medium text-success">+{formatCurrency(trx.amount)}</td>
									<td>
										<div class="flex items-center gap-2">
											{#if trx.paymentMethod === 'QRIS'}
												<QrCode class="w-4 h-4" />
											{:else if trx.paymentMethod === 'Transfer Bank'}
												<CreditCard class="w-4 h-4" />
											{:else}
												<Wallet class="w-4 h-4" />
											{/if}
											{trx.paymentMethod}
										</div>
									</td>
									<td>
										<Badge variant={trx.status === 'success' ? 'success' : 'warning'} size="sm">
											{trx.status === 'success' ? 'Berhasil' : 'Pending'}
										</Badge>
									</td>
								</tr>
							{:else}
								<tr>
									<td colspan="5" class="text-center py-12 text-base-content/50">
										<p>Belum ada transaksi</p>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Campaign Modal -->
{#if showCampaignModal}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<button
				class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
				onclick={() => {
					showCampaignModal = false;
				}}
			>
				<X class="w-4 h-4" />
			</button>
			<h3 class="font-bold text-lg mb-4">
				{isEditMode ? '✏️ Edit Program Donasi' : '💝 Buat Program Donasi'}
			</h3>
			<form method="POST" action={isEditMode ? '?/updateCampaign' : '?/createCampaign'} use:enhance>
				{#if isEditMode}
					<input type="hidden" name="id" value={$form.id} />
				{/if}
				<div class="space-y-4">
					<div class="form-control">
						<label for="title" class="label"><span class="label-text">Nama Program</span></label>
						<input
							type="text"
							name="title"
							class="input input-bordered w-full"
							bind:value={$form.title}
							{...$constraints.title}
							placeholder="Contoh: Renovasi Kubah"
						/>
						{#if $errors.title}<span class="text-error text-xs mt-1">{$errors.title}</span>{/if}
					</div>
					<div class="form-control">
						<label for="target" class="label"
							><span class="label-text">Target Dana (Rp)</span></label
						>
						<label class="input input-bordered w-full flex items-center gap-2">
							<span class="text-base-content/60">Rp</span>
							<input
								class="grow"
								value={formTargetFormatted}
								placeholder="0"
								oninput={formatTargetInput}
							/>
						</label>
						<input type="hidden" name="target" value={$form.target} />
						{#if $errors.target}<span class="text-error text-xs mt-1">{$errors.target}</span>{/if}
					</div>
					<div class="form-control">
						<label for="deadline" class="label"><span class="label-text">Batas Waktu</span></label>
						<input
							type="date"
							name="deadline"
							class="input input-bordered w-full"
							bind:value={$form.deadline}
							{...$constraints.deadline}
						/>
						{#if $errors.deadline}<span class="text-error text-xs mt-1">{$errors.deadline}</span
							>{/if}
					</div>
					<div class="form-control">
						<label for="description" class="label"><span class="label-text">Deskripsi</span></label>
						<textarea
							name="description"
							class="textarea textarea-bordered h-24 w-full"
							bind:value={$form.description}
							{...$constraints.description}
							placeholder="Jelaskan tujuan donasi..."
						></textarea>
					</div>
				</div>
				<div class="modal-action">
					<button type="button" class="btn btn-ghost" onclick={() => (showCampaignModal = false)}
						>Batal</button
					>
					<button type="submit" class="btn btn-primary" disabled={$delayed}>
						{#if $delayed}
							<span class="loading loading-spinner loading-sm"></span>
						{:else}
							<Plus class="w-4 h-4" />
						{/if}
						{isEditMode ? 'Simpan Perubahan' : 'Buat Program'}
					</button>
				</div>
			</form>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button onclick={() => (showCampaignModal = false)}>close</button>
		</form>
	</dialog>
{/if}

<!-- Delete Modal -->
{#if showDeleteModal}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg text-error">⚠️ Hapus Data</h3>
			<p class="py-4">Apakah Anda yakin ingin menghapus data ini?</p>

			<div class="modal-action">
				<button class="btn btn-ghost" onclick={() => (showDeleteModal = false)}>Batal</button>
				<form method="POST" action="?/delete" use:enhance>
					<input type="hidden" name="id" value={$form?.id} />
					<button type="submit" disabled={$delayed} class="btn btn-error">
						{#if $delayed}
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
			<button onclick={() => (showDeleteModal = false)}>close</button>
		</form>
	</dialog>
{/if}
