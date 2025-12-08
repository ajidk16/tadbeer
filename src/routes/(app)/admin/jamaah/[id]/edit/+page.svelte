<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { superForm } from 'sveltekit-superforms';
	import Toast, {
		success as toastSuccess,
		error as toastError
	} from '$lib/components/ui/Toast.svelte';
	import { ArrowLeft, Save, Camera, Upload, X, Trash2 } from 'lucide-svelte';

	let { data } = $props();

	const {
		form,
		errors,
		constraints,
		message,
		delayed,
		enhance: superEnhance
	} = superForm(data.form, {
		onResult: ({ result }) => {
			if (result.type === 'redirect') {
				toastSuccess('Data jamaah berhasil diperbarui');
				goto(result.location);
			} else if (result.type === 'failure') {
				toastError(result.data?.form?.message || 'Gagal menyimpan');
			}
		}
	});

	let isSubmitting = $state(false);
	// Use data.member for initial preview, but form state generally handles the rest? No, avatar is separate.
	let avatarPreview = $state<string | null>(data.member?.imageUrl || null);
	let avatarInput = $state<HTMLInputElement>();

	function handleAvatarChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = () => {
				avatarPreview = reader.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	function handleDelete() {
		if (confirm('Yakin ingin menghapus data jamaah ini?')) {
			const form = document.createElement('form');
			form.method = 'POST';
			form.action = '?/delete';
			document.body.appendChild(form);
			form.submit();
		}
	}
</script>

<svelte:head>
	<title>Edit Jamaah | TadBeer</title>
</svelte:head>

<Toast />

<div class="max-w-2xl mx-auto space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<a href="/admin/jamaah" class="btn btn-ghost btn-sm btn-square">
			<ArrowLeft class="w-5 h-5" />
		</a>
		<div>
			<h1 class="text-2xl font-bold">✏️ Edit Jamaah</h1>
			<p class="text-base-content/60">Perbarui data anggota</p>
		</div>
	</div>

	<!-- Form -->
	<form
		method="POST"
		action="?/update"
		enctype="multipart/form-data"
		use:superEnhance
		class="card bg-base-100 shadow-sm"
	>
		<div class="card-body space-y-4">
			{#if $message}
				<div class="alert alert-error">
					<span>{$message}</span>
				</div>
			{/if}

			<!-- Avatar Upload -->
			<div class="form-control">
				<label for="avatar" class="label"><span class="label-text">Foto Profil</span></label>
				<div class="flex items-center gap-4">
					<div class="avatar {avatarPreview ? '' : 'placeholder'}">
						{#if avatarPreview}
							<div class="w-20 rounded-full">
								<img src={avatarPreview} alt="Preview" />
							</div>
						{:else}
							<div class="bg-primary/10 text-primary rounded-full w-20">
								<Camera class="w-8 h-8" />
							</div>
						{/if}
					</div>
					<div class="space-y-2">
						<input
							type="file"
							name="avatar"
							accept="image/*"
							class="hidden"
							bind:this={avatarInput}
							onchange={handleAvatarChange}
						/>
						<button
							type="button"
							class="btn btn-sm btn-outline"
							onclick={() => avatarInput.click()}
						>
							<Upload class="w-4 h-4" /> Ganti Foto
						</button>
						{#if avatarPreview}
							<button
								type="button"
								class="btn btn-sm btn-ghost text-error"
								onclick={() => (avatarPreview = null)}
							>
								<X class="w-4 h-4" /> Hapus
							</button>
						{/if}
					</div>
				</div>
			</div>

			<div class="divider"></div>

			<!-- Name -->
			<!-- Name -->
			<div class="form-control">
				<label for="name" class="label"
					><span class="label-text">Nama Lengkap <span class="text-error">*</span></span></label
				>
				<input
					type="text"
					name="name"
					class="input input-bordered w-full"
					bind:value={$form.name}
					{...$constraints.name}
				/>
				{#if $errors.name}<span class="text-error text-xs mt-1">{$errors.name}</span>{/if}
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- NIK -->
				<div class="form-control">
					<label for="nik" class="label"><span class="label-text">NIK</span></label>
					<input
						type="text"
						name="nik"
						class="input input-bordered w-full"
						bind:value={$form.nik}
						{...$constraints.nik}
						maxlength="16"
					/>
					{#if $errors.nik}<span class="text-error text-xs mt-1">{$errors.nik}</span>{/if}
				</div>

				<!-- Gender -->
				<div class="form-control">
					<label for="gender" class="label"
						><span class="label-text">Jenis Kelamin <span class="text-error">*</span></span></label
					>
					<select
						name="gender"
						class="select select-bordered w-full"
						bind:value={$form.gender}
						{...$constraints.gender}
						required
					>
						<option value="" disabled>Pilih</option>
						<option value="male">Laki-laki</option>
						<option value="female">Perempuan</option>
					</select>
					{#if $errors.gender}<span class="text-error text-xs mt-1">{$errors.gender}</span>{/if}
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- Birth Date -->
				<div class="form-control">
					<label for="birthDate" class="label"><span class="label-text">Tanggal Lahir</span></label>
					<input
						type="date"
						name="birthDate"
						class="input input-bordered w-full"
						bind:value={$form.birthDate}
						{...$constraints.birthDate}
					/>
				</div>

				<!-- Phone -->
				<div class="form-control">
					<label for="phone" class="label"><span class="label-text">No. Telepon</span></label>
					<input
						type="tel"
						name="phone"
						class="input input-bordered w-full"
						bind:value={$form.phone}
						{...$constraints.phone}
					/>
					{#if $errors.phone}<span class="text-error text-xs mt-1">{$errors.phone}</span>{/if}
				</div>
			</div>

			<!-- Email -->
			<div class="form-control">
				<label for="email" class="label"><span class="label-text">Email</span></label>
				<input
					type="email"
					name="email"
					class="input input-bordered w-full"
					bind:value={$form.email}
					{...$constraints.email}
				/>
				{#if $errors.email}<span class="text-error text-xs mt-1">{$errors.email}</span>{/if}
			</div>

			<!-- Address -->
			<div class="form-control">
				<label for="address" class="label"><span class="label-text">Alamat</span></label>
				<textarea
					name="address"
					class="textarea textarea-bordered w-full"
					rows="3"
					bind:value={$form.address}
					{...$constraints.address}
				></textarea>
			</div>

			<!-- Status -->
			<div class="form-control">
				<label for="status" class="label"><span class="label-text">Status</span></label>
				<select
					name="status"
					class="select select-bordered w-full"
					bind:value={$form.status}
					{...$constraints.status}
				>
					<option value="active">Aktif</option>
					<option value="inactive">Tidak Aktif</option>
				</select>
			</div>

			<!-- Actions -->
			<div class="flex justify-between pt-4 border-t border-base-200">
				<button type="button" class="btn btn-ghost text-error btn-sm" onclick={handleDelete}>
					<Trash2 class="w-4 h-4" /> Hapus
				</button>
				<div class="flex gap-2">
					<a href="/admin/jamaah" class="btn btn-ghost">Batal</a>
					<button type="submit" class="btn btn-primary" disabled={$delayed}>
						{#if $delayed}
							<span class="loading loading-spinner loading-sm"></span>
						{:else}
							<Save class="w-4 h-4" />
						{/if}
						Simpan
					</button>
				</div>
			</div>
		</div>
	</form>
</div>
