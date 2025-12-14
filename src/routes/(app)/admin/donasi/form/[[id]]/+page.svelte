<script lang="ts">
	import { page } from '$app/state';
	import { superForm } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import { campaignSchema } from '$lib/schemas';
	import {
		Calendar,
		Save,
		ArrowLeft,
		Trash2,
		Image as ImageIcon,
		CircleAlert,
		X,
		DollarSign
	} from 'lucide-svelte';
	import { Toast, error as toastError } from '$lib/components/ui';

	const { form, errors, constraints, enhance, delayed, message } = superForm(page.data.form, {
		validators: valibotClient(campaignSchema),
		onResult: ({ result }) => {
			if (result.type === 'failure') {
				toastError('Gagal menyimpan. Periksa input Anda.');
			}
		}
	});

	let isEditMode = $derived(!!$form.id);

	// Preview Image Logic
	let imagePreview = $state($form.image);

	function handleFileChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = () => {
				if (typeof reader.result === 'string') {
					imagePreview = reader.result;
				}
			};
			reader.readAsDataURL(file);
		}
	}

	let formTargetFormatted = $state('');

	// Initialize formTargetFormatted on mount if editing or value exists
	$effect(() => {
		if ($form.target) {
			formTargetFormatted = new Intl.NumberFormat('id-ID').format($form.target);
		}
	});

	function formatTargetInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const value = input.value.replace(/\D/g, '');
		$form.target = Number(value); // Update form store directly
		formTargetFormatted = value ? new Intl.NumberFormat('id-ID').format(Number(value)) : '';
		input.value = formTargetFormatted;
	}
</script>

<svelte:head>
	<title>{isEditMode ? 'Edit' : 'Buat'} Program Donasi | TadBeer</title>
</svelte:head>

<div class="max-w-3xl mx-auto py-8 px-4">
	<!-- Header -->
	<div class="flex items-center gap-4 mb-8">
		<a href="/admin/donasi" class="btn btn-circle btn-ghost btn-sm">
			<ArrowLeft class="w-5 h-5" />
		</a>
		<div>
			<h1 class="text-2xl font-bold">
				{isEditMode ? 'Edit Program Donasi' : 'Buat Program Donasi Baru'}
			</h1>
			<p class="text-base-content/60 text-sm">
				{isEditMode
					? 'Perbarui informasi program donasi ini'
					: 'Isi formulir untuk membuat program donasi baru'}
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
				<CircleAlert class="w-5 h-5" />
				<span>{$message}</span>
			</div>
		{/if}

		{#if isEditMode}
			<input type="hidden" name="id" value={$form.id} />
		{/if}

		<!-- Banner Image Section -->
		<div class="card bg-base-100 shadow-sm border border-base-200 overflow-hidden">
			<div class="card-body p-0">
				<div class="p-6">
					<!-- Banner Image -->
					<div class="form-control w-full">
						<div class="label">
							<span class="label-text font-medium">Foto Program</span>
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
									onchange={handleFileChange}
								/>
								<div class="mt-2 text-xs text-base-content/60 flex items-center gap-1">
									<ImageIcon class="w-3 h-3" />
									<span>Format: JPG, PNG, WEBP (Max 5MB)</span>
								</div>
							</div>
						</div>
						{#if $errors.image}
							<span class="label-text-alt text-error mt-1 flex items-center gap-1">
								<CircleAlert class="w-3 h-3" />
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
				<div class="grid grid-cols-1 gap-6">
					<!-- Title -->
					<div class="form-control">
						<label for="title" class="label font-medium"
							><span class="label-text">Nama Program *</span></label
						>
						<input
							type="text"
							name="title"
							class="input input-bordered w-full {$errors.title ? 'input-error' : ''}"
							placeholder="Contoh: Renovasi Kubah Masjid"
							bind:value={$form.title}
							{...$constraints.title}
						/>
						{#if $errors.title}<span class="text-error text-xs mt-1">{$errors.title}</span>{/if}
					</div>

					<!-- Target Amount -->
					<div class="form-control">
						<label for="target" class="label font-medium"
							><span class="label-text">Target Dana (Rp) *</span></label
						>
						<div class="relative">
							<DollarSign class="absolute left-3 top-3 w-4 h-4 text-base-content/50 z-10" />
							<input
								class="input input-bordered pl-10 w-full {$errors.target ? 'input-error' : ''}"
								value={formTargetFormatted}
								placeholder="0"
								oninput={formatTargetInput}
							/>
							<input type="hidden" name="target" value={$form.target} />
						</div>
						{#if $errors.target}<span class="text-error text-xs mt-1">{$errors.target}</span>{/if}
					</div>

					<!-- Deadline -->
					<div class="form-control">
						<label for="deadline" class="label font-medium"
							><span class="label-text">Batas Waktu *</span></label
						>
						<div class="relative">
							<Calendar class="absolute left-3 top-3 w-4 h-4 text-base-content/50 z-10" />
							<input
								type="date"
								name="deadline"
								class="input input-bordered pl-10 w-full {$errors.deadline ? 'input-error' : ''}"
								bind:value={$form.deadline}
								{...$constraints.deadline}
							/>
						</div>
						{#if $errors.deadline}<span class="text-error text-xs mt-1">{$errors.deadline}</span
							>{/if}
					</div>

					<!-- Description -->
					<div class="form-control">
						<label for="description" class="label font-medium"
							><span class="label-text">Deskripsi Lengkap</span></label
						>
						<textarea
							name="description"
							class="textarea textarea-bordered h-32 w-full"
							placeholder="Jelaskan tujuan penggalangan dana ini..."
							bind:value={$form.description}
						></textarea>
						{#if $errors.description}<span class="text-error text-xs mt-1"
								>{$errors.description}</span
							>{/if}
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
						if (!confirm('Apakah Anda yakin ingin menghapus program ini?')) {
							e.preventDefault();
						}
					}}
				>
					<Trash2 class="w-4 h-4" />
					Hapus Program
				</button>
			{:else}
				<div></div>
				<!-- Spacer -->
			{/if}

			<div class="flex gap-3">
				<a href="/admin/donasi" class="btn btn-ghost">Batal</a>
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
