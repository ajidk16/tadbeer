<script lang="ts">
	import { Badge, Toast, success as toastSuccess, error as toastError } from '$lib/components/ui';
	import { enhance as svelteEnhance } from '$app/forms';
	import { superForm } from 'sveltekit-superforms';
	import {
		Plus,
		Heart,
		DollarSign,
		Users,
		Share2,
		Copy,
		Trash2,
		CreditCard,
		Wallet,
		QrCode,
		Clock,
		SquarePen,
		ImageIcon
	} from 'lucide-svelte';
	import { page } from '$app/state';

	// For Delete Form (using superForm for handling the delete action result)
	const { form, enhance, delayed } = superForm(page.data.form, {
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toastSuccess('Data berhasil dihapus');
				showDeleteModal = false;
			} else if (result.type === 'failure') {
				toastError('Gagal menghapus');
			}
		}
	});

	// View state
	let activeTab = $state('campaigns'); // campaigns, transactions

	// Modal states
	let showDeleteModal = $state(false);
	let selectedItem = $state<any>(null);

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

	function copyLink(id: string) {
		const url = `${window.location.origin}/donasi/${id}`;
		navigator.clipboard
			.writeText(url)
			.then(() => {
				toastSuccess('Link donasi berhasil disalin');
			})
			.catch(() => {
				toastError('Gagal menyalin link');
			});
	}

	function openDelete(item: any) {
		selectedItem = item;
		$form.id = item.id;
		showDeleteModal = true;
	}
</script>

<svelte:head>
	<title>Donasi | TadBeer</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold">💝 Donasi Online</h1>
			<p class="text-base-content/60 mt-1">Kelola program donasi dan infaq</p>
		</div>
		<a href="/admin/donasi/form" class="btn btn-primary btn-sm">
			<Plus class="w-4 h-4" /> Buat Program
		</a>
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
				<div class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
					{#if campaign.imageUrl}
						<figure class="relative aspect-video w-full overflow-hidden">
							<img
								src={campaign.imageUrl}
								alt={campaign.title}
								class="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
								loading="lazy"
							/>
							<div class="absolute top-2 left-2">
								<Badge variant={campaign.status === 'active' ? 'success' : 'ghost'} size="sm">
									{campaign.status === 'active' ? 'Aktif' : 'Selesai'}
								</Badge>
							</div>
							<div class="absolute top-2 right-2">
								<div class="dropdown dropdown-end">
									<button class="btn btn-ghost btn-xs btn-square bg-base-100/90 hover:bg-base-100"
										>⋮</button
									>
									<ul class="dropdown-content menu bg-base-100 rounded-box shadow z-10 w-40 p-1">
										<li>
											<button onclick={() => copyLink(campaign.id.toString())}>
												<Copy class="w-4 h-4" /> Salin Link
											</button>
										</li>
										<li>
											<a href="/admin/donasi/form/{campaign.id}">
												<SquarePen class="w-4 h-4" /> Edit
											</a>
										</li>
										<li>
											<button class="text-error" onclick={() => openDelete(campaign)}>
												<Trash2 class="w-4 h-4" /> Hapus
											</button>
										</li>
									</ul>
								</div>
							</div>
						</figure>
					{:else}
						<div
							class="relative aspect-video w-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center"
						>
							<ImageIcon class="w-12 h-12 text-primary/20" />
							<div class="absolute top-2 left-2">
								<Badge variant={campaign.status === 'active' ? 'success' : 'ghost'} size="sm">
									{campaign.status === 'active' ? 'Aktif' : 'Selesai'}
								</Badge>
							</div>
							<div class="absolute top-2 right-2">
								<div class="dropdown dropdown-end">
									<button class="btn btn-ghost btn-xs btn-square bg-base-100/90 hover:bg-base-100"
										>⋮</button
									>
									<ul class="dropdown-content menu bg-base-100 rounded-box shadow z-10 w-40 p-1">
										<li>
											<button onclick={() => copyLink(campaign.id.toString())}>
												<Copy class="w-4 h-4" /> Salin Link
											</button>
										</li>
										<li>
											<a href="/admin/donasi/form/{campaign.id}">
												<SquarePen class="w-4 h-4" /> Edit
											</a>
										</li>
										<li>
											<button class="text-error" onclick={() => openDelete(campaign)}>
												<Trash2 class="w-4 h-4" /> Hapus
											</button>
										</li>
									</ul>
								</div>
							</div>
						</div>
					{/if}

					<div class="card-body p-4">
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
