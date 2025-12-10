<script lang="ts">
	import {
		Heart,
		Users,
		ArrowLeft,
		Clock,
		Target,
		Share2,
		MessageCircle,
		Copy,
		Check,
		ArrowRight
	} from 'lucide-svelte';
	import { Badge, Toast, success as toastSuccess, error as toastError } from '$lib/components/ui';
	import { page } from '$app/state';
	import { superForm } from 'sveltekit-superforms';

	const campaign = $derived(page.data.campaign);
	const recentDonors = $derived(page.data.recentDonors);
	const comments = $derived(page.data.comments);

	// Donation form
	const {
		form: donationFormData,
		errors: donationErrors,
		enhance: donationEnhance,
		delayed: donationDelayed
	} = superForm(page.data.donationForm, {
		onResult: ({ result }) => {
			if (result.type === 'success' && result.data?.success) {
				toastSuccess('Donasi berhasil! Terima kasih atas kebaikan Anda.');
				showDonationModal = false;
				selectedAmount = 0;
				customAmount = '';
				selectedPayment = '';
			} else if (result.type === 'failure') {
				toastError(result.data?.message || 'Gagal menyimpan donasi');
			}
		}
	});

	// Comment form
	const {
		form: commentFormData,
		errors: commentErrors,
		enhance: commentEnhance,
		delayed: commentDelayed,
		reset: resetCommentForm
	} = superForm(page.data.commentForm, {
		onResult: ({ result }) => {
			if (result.type === 'success' && result.data?.commentSuccess) {
				toastSuccess('Komentar berhasil ditambahkan!');
				resetCommentForm();
			} else if (result.type === 'failure') {
				toastError(result.data?.message || 'Gagal menyimpan komentar');
			}
		}
	});

	// Donation modal state
	let showDonationModal = $state(false);
	let selectedAmount = $state(0);
	let customAmount = $state('');
	let selectedPayment = $state('');

	const presetAmounts = [10000, 25000, 50000, 100000, 250000, 500000];
	const paymentMethods = [
		{ id: 'qris', name: 'QRIS', icon: '📱' },
		{ id: 'transfer', name: 'Transfer Bank', icon: '🏦' },
		{ id: 'ewallet', name: 'E-Wallet', icon: '👛' }
	];

	// Share state
	let copied = $state(false);

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(amount);
	}

	function formatCompactCurrency(amount: number) {
		if (amount >= 1000000) {
			return `Rp ${(amount / 1000000).toFixed(1)}jt`;
		} else if (amount >= 1000) {
			return `Rp ${(amount / 1000).toFixed(0)}rb`;
		}
		return formatCurrency(amount);
	}

	function calculateProgress(collected: number, target: number) {
		if (target === 0) return 0;
		return Math.min(Math.round((collected / target) * 100), 100);
	}

	function formatTimeAgo(date: Date) {
		const now = new Date();
		const diffMs = now.getTime() - new Date(date).getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 60) return `${diffMins} menit lalu`;
		if (diffHours < 24) return `${diffHours} jam lalu`;
		return `${diffDays} hari lalu`;
	}

	function getShareUrl() {
		if (typeof window !== 'undefined') {
			return window.location.href;
		}
		return '';
	}

	async function shareToWhatsApp() {
		const text = `Mari berdonasi untuk ${campaign.title}! ${getShareUrl()}`;
		window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
	}

	async function shareToFacebook() {
		window.open(
			`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`,
			'_blank'
		);
	}

	async function shareToX() {
		const text = `Mari berdonasi untuk ${campaign.title}!`;
		window.open(
			`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(getShareUrl())}`,
			'_blank'
		);
	}

	async function copyLink() {
		await navigator.clipboard.writeText(getShareUrl());
		copied = true;
		toastSuccess('Link berhasil disalin!');
		setTimeout(() => (copied = false), 2000);
	}

	async function nativeShare() {
		if (navigator.share) {
			try {
				await navigator.share({
					title: campaign.title,
					text: `Mari berdonasi untuk ${campaign.title}!`,
					url: getShareUrl()
				});
			} catch {
				// User cancelled
			}
		}
	}
</script>

<svelte:head>
	<title>{campaign.title} | Donasi TadBeer</title>
	<meta name="description" content={campaign.description || `Donasi untuk ${campaign.title}`} />
</svelte:head>

<Toast />

<div class="min-h-screen bg-base-100 pb-24 md:pb-8">
	<!-- Hero Section -->
	<div class="relative h-[35vh] md:h-[45vh] w-full overflow-hidden bg-base-300">
		<img src={campaign.image} alt={campaign.title} class="w-full h-full object-cover" />
		<div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>

		<!-- Back button -->
		<a
			href="/donation"
			class="absolute top-4 left-4 btn btn-circle btn-ghost bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 z-10"
		>
			<ArrowLeft class="w-5 h-5" />
		</a>

		<!-- Title overlay -->
		<div class="absolute bottom-0 left-0 right-0 p-6 md:p-8">
			<div class="container mx-auto">
				<Badge
					variant={campaign.active ? 'success' : 'neutral'}
					class="mb-3 bg-white/20 backdrop-blur-sm border-none text-white"
				>
					{campaign.active ? 'Aktif' : 'Selesai'}
				</Badge>
				<h1 class="text-2xl md:text-4xl font-bold text-white leading-tight mb-2">
					{campaign.title}
				</h1>
				<div class="flex flex-wrap gap-4 text-white/80 text-sm">
					<div class="flex items-center gap-1.5">
						<Users class="w-4 h-4" />
						<span>{campaign.donors} Donatur</span>
					</div>
					<div class="flex items-center gap-1.5">
						<Clock class="w-4 h-4" />
						<span>{campaign.deadline}</span>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="container mx-auto px-4 py-8">
		<div class="grid lg:grid-cols-3 gap-8">
			<!-- Main Content -->
			<div class="lg:col-span-2 space-y-8">
				<!-- Description Card -->
				<div class="card bg-base-100 shadow-lg border border-base-200">
					<div class="card-body">
						<h2 class="card-title text-lg flex items-center gap-2">
							<Target class="w-5 h-5 text-primary" />
							Tentang Program
						</h2>
						<p class="text-base-content/70 whitespace-pre-line leading-relaxed">
							{campaign.description || 'Tidak ada deskripsi untuk program ini.'}
						</p>
					</div>
				</div>

				<!-- Recent Donors -->
				<div class="card bg-base-100 shadow-lg border border-base-200">
					<div class="card-body">
						<h2 class="card-title text-lg flex items-center gap-2">
							<Heart class="w-5 h-5 text-primary fill-primary" />
							Para Donatur
						</h2>

						{#if recentDonors.length === 0}
							<div class="text-center py-8 text-base-content/50">
								<Heart class="w-12 h-12 mx-auto mb-3 opacity-30" />
								<p>Jadilah donatur pertama!</p>
							</div>
						{:else}
							<div class="space-y-4 mt-2">
								{#each recentDonors as donor}
									<div
										class="flex items-center gap-4 p-3 bg-base-200/50 rounded-xl hover:bg-base-200 transition-colors"
									>
										<div class="avatar placeholder">
											<div class="bg-primary/10 text-primary rounded-full w-12">
												<span class="text-lg font-bold">{donor.name.charAt(0).toUpperCase()}</span>
											</div>
										</div>
										<div class="flex-1 min-w-0">
											<p class="font-medium truncate">{donor.name}</p>
											<p class="text-xs text-base-content/50">{formatTimeAgo(donor.createdAt)}</p>
										</div>
										<div class="text-right">
											<p class="font-bold text-primary">{formatCompactCurrency(donor.amount)}</p>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<!-- Comments Section -->
				<div class="card bg-base-100 shadow-lg border border-base-200">
					<div class="card-body">
						<h2 class="card-title text-lg flex items-center gap-2">
							<MessageCircle class="w-5 h-5 text-primary" />
							Doa & Dukungan
							{#if comments.length > 0}
								<Badge variant="ghost" class="ml-2">{comments.length}</Badge>
							{/if}
						</h2>

						<!-- Comment Form -->
						<form
							method="POST"
							action="?/comment"
							use:commentEnhance
							class="bg-base-200/50 rounded-xl p-4 mt-2"
						>
							<input type="hidden" name="campaignId" value={campaign.id} />
							<div class="space-y-3">
								<input
									type="text"
									name="name"
									placeholder="Nama Anda"
									class="input input-bordered w-full input-sm"
									bind:value={$commentFormData.name}
								/>
								{#if $commentErrors.name}
									<span class="text-error text-xs">{$commentErrors.name}</span>
								{/if}
								<textarea
									name="message"
									placeholder="Tuliskan doa atau kata dukungan..."
									class="textarea textarea-bordered w-full"
									rows="2"
									bind:value={$commentFormData.message}
								></textarea>
								{#if $commentErrors.message}
									<span class="text-error text-xs">{$commentErrors.message}</span>
								{/if}
								<button type="submit" class="btn btn-primary btn-sm" disabled={$commentDelayed}>
									{#if $commentDelayed}
										<span class="loading loading-spinner loading-xs"></span>
									{/if}
									Kirim Doa
								</button>
							</div>
						</form>

						<!-- Comments List -->
						{#if comments.length === 0}
							<div class="text-center py-6 text-base-content/50">
								<p class="text-sm">Belum ada doa atau dukungan</p>
							</div>
						{:else}
							<div class="space-y-4 mt-4">
								{#each comments as comment}
									<div class="flex gap-3">
										<div class="avatar placeholder">
											<div class="bg-base-300 text-base-content/50 rounded-full w-10">
												<span class="text-sm font-bold">{comment.name.charAt(0).toUpperCase()}</span
												>
											</div>
										</div>
										<div class="flex-1 bg-base-200/50 rounded-xl p-3">
											<div class="flex items-center gap-2 mb-1">
												<span class="font-medium text-sm">{comment.name}</span>
												{#if comment.amount}
													<Badge variant="primary" class="text-xs"
														>{formatCompactCurrency(comment.amount)}</Badge
													>
												{/if}
											</div>
											<p class="text-sm text-base-content/70">{comment.message}</p>
											<p class="text-xs text-base-content/40 mt-1">
												{formatTimeAgo(comment.createdAt)}
											</p>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Sidebar -->
			<div class="lg:col-span-1">
				<div class="sticky top-24 space-y-6">
					<!-- Progress Card -->
					<div class="card bg-base-100 shadow-xl border border-primary/20">
						<div class="card-body">
							<div class="space-y-4">
								<!-- Collected -->
								<div>
									<p class="text-2xl md:text-3xl font-bold text-primary">
										{formatCurrency(campaign.collected)}
									</p>
									<p class="text-sm text-base-content/60">
										terkumpul dari {formatCompactCurrency(campaign.target)}
									</p>
								</div>

								<!-- Progress Bar -->
								<div class="space-y-2">
									<progress
										class="progress progress-primary w-full h-3"
										value={calculateProgress(campaign.collected, campaign.target)}
										max="100"
									></progress>
									<div class="flex justify-between text-xs text-base-content/60">
										<span>{calculateProgress(campaign.collected, campaign.target)}%</span>
										<span>{campaign.donors} Donatur</span>
									</div>
								</div>

								<!-- Stats -->
								{#if campaign.daysLeft !== null && campaign.daysLeft > 0}
									<div
										class="flex items-center gap-2 text-sm text-base-content/70 bg-base-200/50 p-3 rounded-lg"
									>
										<Clock class="w-4 h-4" />
										<span><strong>{campaign.daysLeft}</strong> hari lagi</span>
									</div>
								{/if}

								<!-- Donate Button -->
								{#if campaign.active}
									<button
										class="btn btn-primary btn-lg w-full shadow-lg shadow-primary/30 gap-2"
										onclick={() => (showDonationModal = true)}
									>
										<Heart class="w-5 h-5" />
										Donasi Sekarang
									</button>
								{:else}
									<button class="btn btn-disabled btn-lg w-full"> Program Telah Berakhir </button>
								{/if}
							</div>
						</div>
					</div>

					<!-- Share Card -->
					<div class="card bg-base-100 shadow-lg border border-base-200">
						<div class="card-body">
							<h3 class="card-title text-base flex items-center gap-2">
								<Share2 class="w-5 h-5 text-primary" />
								Bagikan
							</h3>
							<p class="text-xs text-base-content/60 mb-3">
								Sebarkan kebaikan dengan membagikan program ini
							</p>
							<div class="grid grid-cols-4 gap-2">
								<button
									class="btn btn-square btn-outline hover:bg-green-500 hover:border-green-500 hover:text-white"
									onclick={shareToWhatsApp}
									aria-label="Share to WhatsApp"
								>
									<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
										<path
											d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
										/>
									</svg>
								</button>
								<button
									class="btn btn-square btn-outline hover:bg-blue-600 hover:border-blue-600 hover:text-white"
									onclick={shareToFacebook}
									aria-label="Share to Facebook"
								>
									<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
										<path
											d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
										/>
									</svg>
								</button>
								<button
									class="btn btn-square btn-outline hover:bg-black hover:border-black hover:text-white"
									onclick={shareToX}
									aria-label="Share to X"
								>
									<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
										<path
											d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
										/>
									</svg>
								</button>
								<button
									class="btn btn-square btn-outline hover:bg-primary hover:border-primary hover:text-white"
									onclick={copyLink}
									aria-label="Copy Link"
								>
									{#if copied}
										<Check class="w-5 h-5" />
									{:else}
										<Copy class="w-5 h-5" />
									{/if}
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Donation Modal -->
<dialog class="modal modal-bottom sm:modal-middle" class:modal-open={showDonationModal}>
	<div class="modal-box p-0 overflow-hidden max-w-lg">
		<!-- Header -->
		<div class="bg-gradient-to-r from-primary to-secondary text-primary-content p-6">
			<button
				class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3 text-white/70 hover:text-white"
				onclick={() => (showDonationModal = false)}
			>
				✕
			</button>
			<h3 class="font-bold text-xl flex items-center gap-2">
				<Heart class="w-6 h-6" />
				Donasi Sekarang
			</h3>
			<p class="text-primary-content/80 text-sm mt-1 line-clamp-1">{campaign.title}</p>
		</div>

		<form method="POST" action="?/donate" use:donationEnhance class="p-6 space-y-6">
			<!-- Amount Selection -->
			<div class="space-y-3">
				<label class="text-sm font-medium">Pilih Nominal</label>
				<div class="grid grid-cols-3 gap-2">
					{#each presetAmounts as amount}
						<button
							type="button"
							class="btn btn-sm {selectedAmount === amount ? 'btn-primary' : 'btn-outline'}"
							onclick={() => {
								selectedAmount = amount;
								customAmount = '';
							}}
						>
							{formatCompactCurrency(amount)}
						</button>
					{/each}
				</div>
				<label class="input input-bordered flex items-center gap-2">
					<span class="text-base-content/50">Rp</span>
					<input
						type="number"
						placeholder="Nominal Lainnya"
						class="grow"
						bind:value={customAmount}
						oninput={() => (selectedAmount = 0)}
					/>
				</label>
				<input
					type="hidden"
					name="amount"
					value={customAmount ? parseInt(customAmount) : selectedAmount}
				/>
				{#if $donationErrors.amount}
					<span class="text-error text-xs">{$donationErrors.amount}</span>
				{/if}
			</div>

			<!-- Payment Method -->
			<div class="space-y-3">
				<label class="text-sm font-medium">Metode Pembayaran</label>
				<div class="space-y-2">
					{#each paymentMethods as method}
						<label
							class="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-base-200 transition-colors {selectedPayment ===
							method.id
								? 'border-primary bg-primary/5'
								: 'border-base-200'}"
						>
							<input
								type="radio"
								name="paymentMethod"
								class="radio radio-primary radio-sm"
								value={method.id}
								bind:group={selectedPayment}
							/>
							<span class="text-xl">{method.icon}</span>
							<span class="font-medium text-sm">{method.name}</span>
						</label>
					{/each}
				</div>
				{#if $donationErrors.paymentMethod}
					<span class="text-error text-xs">{$donationErrors.paymentMethod}</span>
				{/if}
			</div>

			<!-- Donor Info (Optional) -->
			<div class="space-y-3">
				<label class="text-sm font-medium">Informasi Donatur (Opsional)</label>
				<input
					type="text"
					name="donorName"
					placeholder="Nama Anda (atau Hamba Allah)"
					class="input input-bordered input-sm w-full"
					bind:value={$donationFormData.donorName}
				/>
				<input
					type="tel"
					name="donorPhone"
					placeholder="Nomor WhatsApp"
					class="input input-bordered input-sm w-full"
					bind:value={$donationFormData.donorPhone}
				/>
			</div>

			<!-- Submit -->
			<button
				type="submit"
				class="btn btn-primary w-full btn-lg shadow-lg shadow-primary/30"
				disabled={$donationDelayed}
			>
				{#if $donationDelayed}
					<span class="loading loading-spinner"></span>
				{/if}
				Lanjut Pembayaran
				<ArrowRight class="w-5 h-5" />
			</button>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop bg-black/50">
		<button onclick={() => (showDonationModal = false)}>close</button>
	</form>
</dialog>
