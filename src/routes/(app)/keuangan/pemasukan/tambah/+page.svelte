<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { FormInput, FormSelect, FormTextarea } from '$lib/components/ui';
	import { ArrowLeft, Save, X } from 'lucide-svelte';

	let { data, form } = $props();

	// Form states
	let isSubmitting = $state(false);
	let amount = $state('');

	// Format amount input
	function formatAmount(e: Event) {
		const input = e.target as HTMLInputElement;
		const value = input.value.replace(/\D/g, '');
		const formatted = new Intl.NumberFormat('id-ID').format(Number(value));
		amount = value;
		input.value = formatted;
	}

	// Handle form submission
	function handleSubmit() {
		return async ({ result, update }: any) => {
			isSubmitting = false;
			if (result.type === 'redirect') {
				goto(result.location);
			} else {
				await update();
			}
		};
	}
</script>

<svelte:head>
	<title>Tambah Pemasukan | Keuangan | MiniMasjid</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<a href="/keuangan/pemasukan" class="btn btn-ghost btn-sm btn-square">
			<ArrowLeft class="w-5 h-5" />
		</a>
		<div>
			<h1 class="text-2xl font-bold">➕ Tambah Pemasukan</h1>
			<p class="text-base-content/60">Catat pemasukan baru ke kas masjid</p>
		</div>
	</div>

	<!-- Form -->
	<form
		method="POST"
		use:enhance={() => {
			isSubmitting = true;
			return handleSubmit();
		}}
		class="card bg-base-100 shadow-sm"
	>
		<div class="card-body space-y-4">
			{#if form?.error}
				<div class="alert alert-error">
					<span>{form.error}</span>
				</div>
			{/if}

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- Tanggal -->
				<FormInput
					label="Tanggal"
					name="date"
					type="date"
					value={new Date().toISOString().split('T')[0]}
					required
				/>

				<!-- Kategori -->
				<FormSelect
					label="Kategori"
					name="category"
					required
					options={[
						{ value: '', label: 'Pilih kategori', disabled: true },
						{ value: 'Infaq', label: 'Infaq' },
						{ value: 'Zakat', label: 'Zakat' },
						{ value: 'Sadaqah', label: 'Sadaqah' },
						{ value: 'Wakaf', label: 'Wakaf' },
						{ value: 'Lainnya', label: 'Lainnya' }
					]}
				/>
			</div>

			<!-- Jumlah -->
			<div class="form-control">
				<label class="label">
					<span class="label-text">Jumlah <span class="text-error">*</span></span>
				</label>
				<label class="input input-bordered flex items-center gap-2">
					<span class="text-base-content/60">Rp</span>
					<input
						type="text"
						name="amount"
						class="grow"
						placeholder="0"
						required
						oninput={formatAmount}
					/>
				</label>
				<input type="hidden" name="amountRaw" value={amount} />
			</div>

			<!-- Keterangan -->
			<FormInput
				label="Keterangan"
				name="description"
				placeholder="Contoh: Infaq Jumat Minggu I Desember"
				required
			/>

			<!-- Catatan -->
			<FormTextarea
				label="Catatan (opsional)"
				name="notes"
				placeholder="Catatan tambahan..."
				rows={3}
			/>

			<!-- Bukti Transaksi -->
			<div class="form-control">
				<label class="label">
					<span class="label-text">Bukti Transaksi (opsional)</span>
				</label>
				<input
					type="file"
					name="receipt"
					class="file-input file-input-bordered w-full"
					accept="image/*,.pdf"
				/>
				<label class="label">
					<span class="label-text-alt text-base-content/50">Format: JPG, PNG, PDF. Maks 5MB</span>
				</label>
			</div>

			<!-- Actions -->
			<div class="flex justify-end gap-2 pt-4 border-t border-base-200">
				<a href="/keuangan/pemasukan" class="btn btn-ghost">
					<X class="w-4 h-4" />
					Batal
				</a>
				<button type="submit" class="btn btn-primary" disabled={isSubmitting}>
					{#if isSubmitting}
						<span class="loading loading-spinner loading-sm"></span>
					{:else}
						<Save class="w-4 h-4" />
					{/if}
					Simpan
				</button>
			</div>
		</div>
	</form>
</div>
