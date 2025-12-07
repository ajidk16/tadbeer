<script lang="ts">
	import { ArrowLeft, Save, Camera } from 'lucide-svelte';

	import { superForm } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import { profileSchema } from '$lib/schemas';
	import { success as toastSuccess, error as toastError } from '$lib/components/ui';

	let { data } = $props();

	const { form, errors, enhance, submitting, message } = superForm(data.form, {
		validators: valibotClient(profileSchema),
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toastSuccess(result.data?.message || 'Profile updated successfully');
			} else if (result.type === 'failure') {
				toastError(result.data?.message || 'Failed to update profile');
			}
		}
	});

	let location = $state('Jakarta Selatan, Indonesia'); // Placeholder as not in DB
	let avatarPreview = $state(data.user.avatarUrl);
	let fileInput: HTMLInputElement;

	function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			const file = target.files[0];
			avatarPreview = URL.createObjectURL(file);
		}
	}
</script>

<div class="max-w-2xl mx-auto space-y-6 p-4 md:p-6">
	<div class="flex items-center gap-4 mb-6">
		<a href="/admin/profile" class="btn btn-ghost btn-circle btn-sm">
			<ArrowLeft class="w-5 h-5" />
		</a>
		<div>
			<h1 class="text-2xl font-bold">Edit Profile</h1>
			<p class="text-base-content/60">Update your personal information.</p>
		</div>
	</div>

	<div class="card bg-base-100 shadow-sm border border-base-200">
		<div class="card-body space-y-4">
			<!-- Avatar Upload -->
			<form method="POST" enctype="multipart/form-data" use:enhance class="contents">
				<div class="flex flex-col items-center gap-4 mb-4">
					<button
						type="button"
						class="relative group cursor-pointer"
						onclick={() => fileInput.click()}
					>
						<div class="avatar placeholder">
							<div
								class="bg-neutral text-neutral-content rounded-full w-24 text-3xl overflow-hidden"
							>
								{#if avatarPreview}
									<img src={avatarPreview} alt="Avatar" />
								{:else}
									<span>{data.user.fullName?.charAt(0) || 'A'}</span>
								{/if}
							</div>
						</div>
						<div
							class="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
						>
							<Camera class="w-6 h-6 text-white" />
						</div>
					</button>
					<button type="button" class="btn btn-ghost btn-xs" onclick={() => fileInput.click()}
						>Change Avatar</button
					>
					<input
						type="file"
						name="avatar"
						class="hidden"
						accept="image/*"
						bind:this={fileInput}
						onchange={handleFileChange}
					/>
				</div>

				<div class="form-control">
					<label class="label" for="fullName">
						<span class="label-text font-medium">Full Name</span>
					</label>
					<input
						type="text"
						id="fullName"
						name="fullName"
						bind:value={$form.fullName}
						class="input input-bordered w-full"
					/>
					{#if $errors.fullName}<span class="text-error text-sm mt-1">{$errors.fullName}</span>{/if}
				</div>

				<div class="form-control">
					<label class="label" for="about">
						<span class="label-text font-medium">Bio</span>
					</label>
					<textarea
						id="about"
						name="about"
						bind:value={$form.about}
						class="textarea textarea-bordered h-24 w-full"
					></textarea>
					<label for="about" class="label">
						<span class="label-text-alt">Brief description for your profile.</span>
					</label>
					{#if $errors.about}<span class="text-error text-sm mt-1">{$errors.about}</span>{/if}
				</div>

				<div class="form-control">
					<label class="label" for="phone">
						<span class="label-text font-medium">Phone Number</span>
					</label>
					<input
						type="tel"
						id="phone"
						name="phone"
						bind:value={$form.phone}
						class="input input-bordered w-full"
					/>
					{#if $errors.phone}<span class="text-error text-sm mt-1">{$errors.phone}</span>{/if}
				</div>

				<div class="form-control">
					<label class="label" for="location">
						<span class="label-text font-medium">Location</span>
					</label>
					<input
						type="text"
						id="location"
						bind:value={location}
						class="input input-bordered w-full"
						disabled
					/>
					<label for="location" class="label">
						<span class="label-text-alt text-warning">Location update not yet supported.</span>
					</label>
				</div>

				<div class="card-actions justify-end mt-4">
					<a href="/admin/profile" class="btn btn-ghost">Cancel</a>
					<button class="btn btn-primary" disabled={$submitting}>
						{#if $submitting}
							<span class="loading loading-spinner loading-xs"></span>
						{:else}
							<Save class="w-4 h-4 mr-2" />
						{/if}
						Save Changes
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
