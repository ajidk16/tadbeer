<script lang="ts">
	import { Heart, ArrowRight } from 'lucide-svelte';
	import { Badge, Toast, success as toastSuccess, error as toastError } from '$lib/components/ui';
	import { page } from '$app/state';
	import { superForm } from 'sveltekit-superforms';

	// Get data from server
	const campaigns = $derived(page.data.campaigns);

	const { form, errors, enhance, delayed } = superForm(page.data.form, {
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toastSuccess('Donasi berhasil! Terima kasih atas kebaikan Anda.');
				selectedAmount = 0;
				customAmount = '';
				selectedPayment = '';
			} else if (result.type === 'failure') {
				toastError(result.data?.message || 'Gagal menyimpan donasi');
			}
		}
	});

	const paymentMethods = [
		{ id: 'qris', name: 'QRIS', icon: '📱' },
		{ id: 'transfer', name: 'Transfer Bank', icon: '🏦' },
		{ id: 'ewallet', name: 'E-Wallet', icon: '👛' }
	];

	let selectedAmount = $state(0);
	let customAmount = $state('');
	let selectedPayment = $state('');

	const presetAmounts = [10000, 20000, 50000, 100000, 200000, 500000];

	// Sync form values
	$effect(() => {
		const amount = customAmount ? parseInt(customAmount) : selectedAmount;
		$form.amount = amount;
		$form.paymentMethod = selectedPayment;
	});

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(amount);
	}

	function calculateProgress(collected: number, target: number) {
		return Math.min(Math.round((collected / target) * 100), 100);
	}
</script>

<svelte:head>
	<title>Donasi Online | TadBeer</title>
</svelte:head>

<Toast />

<div class="container mx-auto px-4 py-8 pb-24 md:pb-8">
	<div class="grid lg:grid-cols-3 gap-8">
		<!-- Left Column: Campaigns -->
		<div class="lg:col-span-3 space-y-8">
			<div>
				<h1 class="text-3xl font-bold text-primary mb-2">Mari Berbagi Kebaikan</h1>
				<p class="text-base-content/70">
					Salurkan infaq dan shodaqoh terbaik Anda untuk kemakmuran masjid dan kesejahteraan umat.
				</p>
			</div>

			<div class="grid md:grid-cols-2 gap-6">
				{#each campaigns as campaign}
					<div
						class="card bg-base-100 shadow-sm hover:shadow-md transition-all border border-base-200 group"
					>
						<figure class="relative h-48 overflow-hidden">
							<img
								src={campaign.image}
								alt={campaign.title}
								class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
							/>
							<div
								class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4"
							>
								<div class="text-white text-xs font-medium flex justify-between items-end">
									<span>{campaign.deadline}</span>
									<span>{campaign.donors} Donatur</span>
								</div>
							</div>
						</figure>
						<div class="card-body p-5">
							<h3 class="card-title text-lg font-bold mb-3">{campaign.title}</h3>

							<div class="space-y-2 mb-4">
								<div class="flex justify-between text-sm">
									<span class="text-primary font-bold">{formatCurrency(campaign.collected)}</span>
									<span class="text-base-content/50">dari {formatCurrency(campaign.target)}</span>
								</div>
								<progress
									class="progress progress-primary w-full"
									value={calculateProgress(campaign.collected, campaign.target)}
									max="100"
								></progress>
							</div>

							<a href="/donation/{campaign.id}" class="btn btn-primary btn-sm w-full btn-outline">
								Lihat Detail <ArrowRight class="w-4 h-4" />
							</a>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Right Column: Quick Donation Form -->
		<!-- <div class="lg:col-span-1">
			<div class="card bg-base-100 shadow-xl border border-primary/10 sticky top-24">
				<div class="card-body">
					<h2 class="card-title flex items-center gap-2 mb-4">
						<Heart class="w-6 h-6 text-primary fill-primary" />
						Donasi Cepat
					</h2>

					<form method="POST" action="?/donate" use:enhance>
						<div class="space-y-4 mb-6">
							<span class="text-sm font-medium block mb-2">Pilih Nominal</span>
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
										{amount / 1000}k
									</button>
								{/each}
							</div>
							<div class="form-control">
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
							</div>

							<input
								type="hidden"
								name="amount"
								value={customAmount ? parseInt(customAmount) : selectedAmount}
							/>
							{#if $errors.amount}
								<span class="text-error text-xs">{$errors.amount}</span>
							{/if}
						</div>

						<div class="space-y-4 mb-6">
							<span class="text-sm font-medium block mb-2">Metode Pembayaran</span>
							<div class="space-y-2">
								{#each paymentMethods as method}
									<label
										class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-base-200 transition-colors {selectedPayment ===
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
							{#if $errors.paymentMethod}
								<span class="text-error text-xs">{$errors.paymentMethod}</span>
							{/if}
						</div>

						<button
							type="submit"
							class="btn btn-primary w-full shadow-lg shadow-primary/20"
							disabled={$delayed}
						>
							{#if $delayed}
								<span class="loading loading-spinner loading-sm"></span>
							{/if}
							Lanjut Pembayaran
							<ArrowRight class="w-4 h-4" />
						</button>
					</form>

					<p class="text-xs text-center text-base-content/50 mt-4">
						Terverifikasi aman & transparan
					</p>
				</div>
			</div>
		</div> -->
	</div>
</div>
