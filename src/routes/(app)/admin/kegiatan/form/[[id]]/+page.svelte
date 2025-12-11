<script lang="ts">
	import { page } from '$app/state';
	import { superForm } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import { eventSchema } from '$lib/schemas';
	import {
		Calendar,
		Clock,
		MapPin,
		Save,
		ArrowLeft,
		Trash2,
		Image as ImageIcon,
		AlertCircle,
		X
	} from 'lucide-svelte';
	import { Toast, error as toastError } from '$lib/components/ui';

	const { form, errors, constraints, enhance, delayed, message } = superForm(page.data.form, {
		validators: valibotClient(eventSchema),
		onResult: ({ result }) => {
			console.log('Form submission result:', result);
			if (result.type === 'failure') {
				toastError('Gagal menyimpan. Periksa input Anda.');
			}
			// Success redirection is handled by server throw redirect
		}
	});

	const categories = ['kajian', 'ibadah', 'sosial', 'phbi', 'rapat', 'lainnya'];

	let isEditMode = $derived(!!$form.id);

	// Preview Image Logic
	let imagePreview = $derived($form.image);
</script>

<svelte:head>
	<title>{isEditMode ? 'Edit' : 'Tambah'} Kegiatan | TadBeer</title>
</svelte:head>

<div class="max-w-3xl mx-auto py-8 px-4">
	<!-- Header -->
	<div class="flex items-center gap-4 mb-8">
		<a href="/admin/kegiatan" class="btn btn-circle btn-ghost btn-sm">
			<ArrowLeft class="w-5 h-5" />
		</a>
		<div>
			<h1 class="text-2xl font-bold">{isEditMode ? 'Edit Kegiatan' : 'Tambah Kegiatan Baru'}</h1>
			<p class="text-base-content/60 text-sm">
				{isEditMode
					? 'Perbarui informasi kegiatan acara ini'
					: 'Isi formulir untuk membuat kegiatan baru ini'}
			</p>
		</div>
	</div>

	<!-- Main Form -->
	<form
		method="POST"
		action={isEditMode ? '?/update' : '?/create'}
		use:enhance
		class="space-y-8"
		enctype="multipart/form-data"
	>
		{#if $message}
			<div role="alert" class="alert alert-error">
				<AlertCircle class="w-5 h-5" />
				<span>{$message}</span>
			</div>
		{/if}

		{#if isEditMode}
			<input type="hidden" name="id" value={$form.id} />
		{/if}

		<!-- Banner Image Section -->
		<div class="card bg-base-100 shadow-sm border border-base-200 overflow-hidden">
			<div class="card-body p-0">
				<!-- Preview Area -->
				<!-- <div
					class="relative w-full h-48 sm:h-64 bg-base-200 flex items-center justify-center overflow-hidden group"
				>
					{#if imagePreview}
						<img
							src={imagePreview}
							alt="Banner Preview"
							class="w-full h-full object-cover transition-transform group-hover:scale-105"
						/>
						<div
							class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
						>
							<span class="text-white font-medium">Preview Banner</span>
						</div>
					{:else}
						<div class="flex flex-col items-center text-base-content/40">
							<ImageIcon class="w-12 h-12 mb-2" />
							<span>Belum ada banner</span>
						</div>
					{/if}
				</div> -->

				<!-- Input Area -->
				<div class="p-6">
					<!-- Banner Image -->
					<div class="form-control w-full">
						<div class="label">
							<span class="label-text font-medium">Banner Foto</span>
						</div>

						<div class="flex flex-col gap-4">
							{#if imagePreview}
								<div
									class="relative w-full aspect-video rounded-xl overflow-hidden bg-base-200 border border-base-300 group"
								>
									<img
										src={imagePreview}
										alt="Preview Banner"
										class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
									/>
									<button
										type="button"
										class="absolute top-2 right-2 btn btn-circle btn-sm btn-error/90 hover:btn-error shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
										onclick={() => {
											imagePreview = '';
											// We can't clear file input programmatically easily without binding or refs,
											// but clearing preview is good enough for UI feedback.
											// The form submission will still send the file unless we reset the form element,
											// but backend will handle empty file.
										}}
									>
										<X class="w-4 h-4" />
									</button>
									<div
										class="absolute bottom-0 left-0 right-0 p-3 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
									>
										<p class="text-white text-xs font-medium">Klik tombol hapus untuk mengganti</p>
									</div>
								</div>
							{/if}

							<div class="relative">
								<input
									type="file"
									name="image"
									accept="image/*"
									class="file-input file-input-bordered file-input-primary w-full"
									onchange={(e) => {
										const file = e.currentTarget.files?.[0];
										if (file) {
											const reader = new FileReader();
											reader.onload = (e) => {
												imagePreview = e.target?.result as string;
											};
											reader.readAsDataURL(file);
										}
									}}
								/>
								<div class="mt-2 text-xs text-base-content/60 flex items-center gap-1">
									<ImageIcon class="w-3 h-3" />
									<span>Format: JPG, PNG, WEBP (Max 5MB)</span>
								</div>
							</div>
						</div>
						{#if $errors.image}
							<span class="label-text-alt text-error mt-1 flex items-center gap-1">
								<AlertCircle class="w-3 h-3" />
								{$errors.image}
							</span>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Basic Info Section -->
		<div class="card bg-base-100 shadow-sm border border-base-200">
			<div class="card-body">
				<h2 class="card-title text-lg mb-4">Informasi Utama</h2>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<!-- Title -->
					<div class="form-control md:col-span-2">
						<label for="title" class="label font-medium"
							><span class="label-text">Judul Kegiatan *</span></label
						>
						<input
							type="text"
							name="title"
							class="input input-bordered w-full {$errors.title ? 'input-error' : ''}"
							placeholder="Contoh: Kajian Rutin Malam Minggu"
							bind:value={$form.title}
							{...$constraints.title}
						/>
						{#if $errors.title}<span class="text-error text-xs mt-1">{$errors.title}</span>{/if}
					</div>

					<!-- Category -->
					<div class="form-control">
						<label for="category" class="label font-medium"
							><span class="label-text">Kategori *</span></label
						>
						<select
							name="category"
							class="select select-bordered w-full {$errors.category ? 'select-error' : ''}"
							bind:value={$form.category}
							{...$constraints.category}
						>
							<option value="" disabled>Pilih Kategori</option>
							{#each categories as cat}
								<option value={cat}>{cat}</option>
							{/each}
						</select>
						{#if $errors.category}<span class="text-error text-xs mt-1">{$errors.category}</span
							>{/if}
					</div>

					<!-- Location -->
					<div class="form-control">
						<label for="location" class="label font-medium"
							><span class="label-text">Lokasi</span></label
						>
						<div class="relative">
							<MapPin class="absolute left-3 top-3 w-4 h-4 text-base-content/50 z-10" />
							<input
								type="text"
								name="location"
								class="input input-bordered pl-10 w-full"
								placeholder="Masjid Utama, Lantai 1..."
								bind:value={$form.location}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Date & Time Section -->
		<div class="card bg-base-100 shadow-sm border border-base-200">
			<div class="card-body">
				<h2 class="card-title text-lg mb-4">Waktu Pelaksanaan</h2>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
					<!-- Date -->
					<div class="form-control">
						<label for="date" class="label font-medium"
							><span class="label-text">Tanggal *</span></label
						>
						<div class="relative">
							<Calendar class="absolute left-3 top-3 w-4 h-4 text-base-content/50 z-10" />
							<input
								type="date"
								name="date"
								class="input input-bordered pl-10 w-full {$errors.date ? 'input-error' : ''}"
								bind:value={$form.date}
								{...$constraints.date}
							/>
						</div>
						{#if $errors.date}<span class="text-error text-xs mt-1">{$errors.date}</span>{/if}
					</div>

					<!-- Start Time -->
					<div class="form-control">
						<label for="time" class="label font-medium"
							><span class="label-text">Mulai *</span></label
						>
						<div class="relative">
							<Clock class="absolute left-3 top-3 w-4 h-4 text-base-content/50 z-10" />
							<input
								type="time"
								name="time"
								class="input input-bordered pl-10 w-full {$errors.time ? 'input-error' : ''}"
								bind:value={$form.time}
								{...$constraints.time}
							/>
						</div>
						{#if $errors.time}<span class="text-error text-xs mt-1">{$errors.time}</span>{/if}
					</div>

					<!-- End Time -->
					<div class="form-control">
						<label for="endTime" class="label font-medium"
							><span class="label-text">Selesai</span></label
						>
						<div class="relative">
							<Clock class="absolute left-3 top-3 w-4 h-4 text-base-content/50 z-10" />
							<input
								type="time"
								name="endTime"
								class="input input-bordered pl-10 w-full"
								bind:value={$form.endTime}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Additional Details -->
		<div class="card bg-base-100 shadow-sm border border-base-200">
			<div class="card-body">
				<h2 class="card-title text-lg mb-4">Detail Tambahan</h2>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="form-control">
						<label for="capacity" class="label font-medium"
							><span class="label-text">Kapasitas Peserta</span></label
						>
						<input
							name="capacity"
							class="input input-bordered w-full"
							placeholder="Tidak terbatas"
							bind:value={$form.capacity}
						/>
					</div>

					<div class="form-control">
						<label for="speaker" class="label font-medium"
							><span class="label-text">Pembicara / Pengisi Acara</span></label
						>
						<input
							type="text"
							name="speaker"
							class="input input-bordered w-full"
							placeholder="Ust. Fulan, dsb"
							bind:value={$form.speaker}
						/>
					</div>

					<div class="form-control md:col-span-2">
						<label for="description" class="label font-medium"
							><span class="label-text">Deskripsi Lengkap</span></label
						>
						<textarea
							name="description"
							class="textarea textarea-bordered h-32 w-full"
							placeholder="Jelaskan detail kegiatan..."
							bind:value={$form.description}
						></textarea>
					</div>
				</div>
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="flex items-center justify-between pt-4">
			{#if isEditMode}
				<button
					type="submit"
					formaction="?/delete"
					class="btn btn-error btn-outline"
					onclick={(e) => {
						if (!confirm('Apakah Anda yakin ingin menghapus kegiatan ini?')) {
							e.preventDefault();
						}
					}}
				>
					<Trash2 class="w-4 h-4" />
					Hapus Kegiatan
				</button>
			{:else}
				<div></div>
				<!-- Spacer -->
			{/if}

			<div class="flex gap-3">
				<a href="/admin/kegiatan" class="btn btn-ghost">Batal</a>
				<button type="submit" class="btn btn-primary min-w-[120px]" disabled={$delayed}>
					{#if $delayed}
						<span class="loading loading-spinner text-white"></span>
					{:else}
						<Save class="w-4 h-4" />
					{/if}
					Simpan
				</button>
			</div>
		</div>
	</form>
</div>
