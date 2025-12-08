<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { goto } from '$app/navigation';
	import { ArrowLeft, Save, Upload, X, Image as ImageIcon } from 'lucide-svelte';
	import { Toast, success as toastSuccess, error as toastError } from '$lib/components/ui';
	import { page } from '$app/state';

	const { form, errors, constraints, enhance, delayed } = superForm(page.data.form, {
		onResult: ({ result }) => {
			if (result.type === 'redirect') {
				toastSuccess('Aset berhasil ditambahkan');
				goto(result.location);
			} else if (result.type === 'failure') {
				toastError(result.data?.message || 'Gagal menyimpan aset');
			}
		}
	});

	let imagePreview = $state<string | null>(null);
	let imageInput: HTMLInputElement;

	function handleImageChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = () => {
				imagePreview = reader.result as string;
			};
			reader.readAsDataURL(file);
		}
	}
</script>

<svelte:head>
	<title>Tambah Aset | TadBeer</title>
</svelte:head>

<Toast />

<div class="max-w-3xl mx-auto space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<a href="/admin/inventaris" class="btn btn-ghost btn-sm btn-square">
			<ArrowLeft class="w-5 h-5" />
		</a>
		<div>
			<h1 class="text-2xl font-bold">➕ Tambah Aset</h1>
			<p class="text-base-content/60">Daftarkan barang inventaris baru</p>
		</div>
	</div>

	<!-- Form -->
	<form method="POST" enctype="multipart/form-data" use:enhance class="card bg-base-100 shadow-sm">
		<div class="card-body space-y-6">
			{#if $errors._errors}
				<div class="alert alert-error">
					<span>{$errors._errors}</span>
				</div>
			{/if}

			<!-- Image Upload -->
			<div class="form-control">
				<label for="image" class="label"><span class="label-text">Foto Aset</span></label>
				<div class="flex flex-col sm:flex-row items-start gap-4">
					<div class="avatar rounded-xl {imagePreview ? '' : 'placeholder'}">
						{#if imagePreview}
							<div class="w-32 h-32 rounded-xl border border-base-300">
								<img src={imagePreview} alt="Preview" class="object-cover w-full h-full" />
							</div>
						{:else}
							<div
								class="bg-base-200 text-base-content/30 rounded-xl w-32 h-32 border-2 border-dashed border-base-300 flex items-center justify-center"
							>
								<ImageIcon class="w-10 h-10" />
							</div>
						{/if}
					</div>
					<div class="space-y-2 pt-2">
						<input
							type="file"
							name="image"
							accept="image/*"
							class="hidden"
							bind:this={imageInput}
							onchange={handleImageChange}
						/>
						<div class="flex gap-2">
							<button
								type="button"
								class="btn btn-sm btn-outline"
								onclick={() => imageInput.click()}
							>
								<Upload class="w-4 h-4" /> Upload Foto
							</button>
							{#if imagePreview}
								<button
									type="button"
									class="btn btn-sm btn-ghost text-error"
									onclick={() => {
										imagePreview = null;
										// Reset file input if needed
										if (imageInput) imageInput.value = '';
									}}
								>
									<X class="w-4 h-4" /> Hapus
								</button>
							{/if}
						</div>
						<p class="text-xs text-base-content/50">Format JPG, PNG. Maksimal 2MB.</p>
					</div>
				</div>
			</div>

			<div class="divider"></div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<!-- Basic Info -->
				<div class="space-y-4">
					<h3 class="font-semibold text-sm text-base-content/70 uppercase tracking-wider">
						Informasi Dasar
					</h3>

					<div class="form-control">
						<label for="name" class="label"
							><span class="label-text">Nama Aset <span class="text-error">*</span></span></label
						>
						<input
							type="text"
							name="name"
							class="input input-bordered w-full {$errors.name ? 'input-error' : ''}"
							placeholder="Contoh: Sound System Yamaha"
							bind:value={$form.name}
							{...$constraints.name}
						/>
						{#if $errors.name}<span class="text-error text-sm mt-1">{$errors.name}</span>{/if}
					</div>

					<div class="form-control">
						<label for="code" class="label"><span class="label-text">Kode Aset</span></label>
						<input
							type="text"
							name="code"
							class="input input-bordered w-full {$errors.code ? 'input-error' : ''}"
							placeholder="Auto-generated jika kosong"
							bind:value={$form.code}
							{...$constraints.code}
						/>
						{#if $errors.code}<span class="text-error text-sm mt-1">{$errors.code}</span>{/if}
					</div>

					<div class="form-control">
						<label for="category" class="label"
							><span class="label-text">Kategori <span class="text-error">*</span></span></label
						>
						<select
							name="category"
							class="select select-bordered w-full {$errors.category ? 'select-error' : ''}"
							bind:value={$form.category}
							{...$constraints.category}
						>
							<option value="" disabled selected>Pilih Kategori</option>
							<option value="Elektronik">Elektronik</option>
							<option value="Furniture">Furniture</option>
							<option value="Perlengkapan">Perlengkapan</option>
							<option value="Kendaraan">Kendaraan</option>
							<option value="Lainnya">Lainnya</option>
						</select>
						{#if $errors.category}<span class="text-error text-sm mt-1">{$errors.category}</span
							>{/if}
					</div>
				</div>

				<!-- Details -->
				<div class="space-y-4">
					<h3 class="font-semibold text-sm text-base-content/70 uppercase tracking-wider">
						Detail & Kondisi
					</h3>

					<div class="grid grid-cols-2 gap-4">
						<div class="form-control">
							<label for="quantity" class="label"
								><span class="label-text">Jumlah <span class="text-error">*</span></span></label
							>
							<input
								type="number"
								name="quantity"
								class="input input-bordered w-full {$errors.quantity ? 'input-error' : ''}"
								min="1"
								bind:value={$form.quantity}
								{...$constraints.quantity}
							/>
							{#if $errors.quantity}<span class="text-error text-sm mt-1">{$errors.quantity}</span
								>{/if}
						</div>
						<div class="form-control">
							<label for="condition" class="label"
								><span class="label-text">Kondisi <span class="text-error">*</span></span></label
							>
							<select
								name="condition"
								class="select select-bordered w-full {$errors.condition ? 'select-error' : ''}"
								bind:value={$form.condition}
								{...$constraints.condition}
							>
								<option value="good">Baik</option>
								<option value="maintenance">Perlu Perbaikan</option>
								<option value="damaged">Rusak</option>
								<option value="lost">Hilang</option>
							</select>
							{#if $errors.condition}<span class="text-error text-sm mt-1">{$errors.condition}</span
								>{/if}
						</div>
					</div>

					<div class="form-control">
						<label for="location" class="label"
							><span class="label-text">Lokasi Penyimpanan</span></label
						>
						<input
							type="text"
							name="location"
							class="input input-bordered w-full {$errors.location ? 'input-error' : ''}"
							placeholder="Contoh: Gudang Utama"
							bind:value={$form.location}
							{...$constraints.location}
						/>
						{#if $errors.location}<span class="text-error text-sm mt-1">{$errors.location}</span
							>{/if}
					</div>

					<div class="form-control">
						<label for="purchaseDate" class="label"
							><span class="label-text">Tanggal Pembelian</span></label
						>
						<input
							type="date"
							name="purchaseDate"
							class="input input-bordered w-full {$errors.purchaseDate ? 'input-error' : ''}"
							bind:value={$form.purchaseDate}
							{...$constraints.purchaseDate}
						/>
						{#if $errors.purchaseDate}<span class="text-error text-sm mt-1"
								>{$errors.purchaseDate}</span
							>{/if}
					</div>

					<div class="form-control">
						<label for="price" class="label"><span class="label-text">Harga Per Unit</span></label>
						<div class="input-group">
							<div class="flex">
								<span
									class="bg-base-200 px-3 py-2 border border-r-0 border-base-300 rounded-l-lg text-sm flex items-center"
									>Rp</span
								>
								<input
									type="number"
									name="price"
									class="input input-bordered w-full rounded-l-none pl-2 {$errors.price
										? 'input-error'
										: ''}"
									bind:value={$form.price}
									{...$constraints.price}
								/>
							</div>
						</div>
						{#if $errors.price}<span class="text-error text-sm mt-1">{$errors.price}</span>{/if}
					</div>
				</div>
			</div>

			<div class="form-control">
				<label for="description" class="label"
					><span class="label-text">Deskripsi / Catatan</span></label
				>
				<textarea
					name="description"
					class="textarea textarea-bordered h-24 w-full {$errors.description
						? 'textarea-error'
						: ''}"
					placeholder="Deskripsi detail aset..."
					bind:value={$form.description}
					{...$constraints.description}
				></textarea>
				{#if $errors.description}<span class="text-error text-sm mt-1">{$errors.description}</span
					>{/if}
			</div>

			<!-- Actions -->
			<div class="flex justify-end gap-2 pt-4 border-t border-base-200">
				<a href="/admin/inventaris" class="btn btn-ghost">Batal</a>
				<button type="submit" class="btn btn-primary" disabled={$delayed}>
					{#if $delayed}
						<span class="loading loading-spinner loading-sm"></span>
					{:else}
						<Save class="w-4 h-4" />
					{/if}
					Simpan Aset
				</button>
			</div>
		</div>
	</form>
</div>
