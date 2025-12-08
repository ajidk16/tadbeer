<script lang="ts">
	import { Globe, Shield, Save } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { success as toastSuccess, error as toastError } from '$lib/components/ui';
	import { page } from '$app/state';

	let maintenanceMode = $state(page.data.config.maintenanceMode);
	let registrationOpen = $state(page.data.config.registrationOpen);
	let debugMode = $state(page.data.config.debugMode);
	let sessionTimeout = $state(page.data.config.sessionTimeout);
	let maxUploadSize = $state(page.data.config.maxUploadSize);
	let isSaving = $state(false);

	function handleSave() {
		isSaving = true;
		return async ({ result, update }: any) => {
			isSaving = false;
			if (result.type === 'success') {
				toastSuccess('Configuration updated successfully');
				await update();
			} else {
				toastError('Failed to update configuration');
			}
		};
	}
</script>

<svelte:head>
	<title>System Configuration | Minimasjid</title>
</svelte:head>

<form method="POST" action="?/update" use:enhance={handleSave} class="space-y-6">
	<div class="border-b border-base-200 pb-4">
		<h2 class="text-2xl font-bold">System Configuration</h2>
		<p class="text-base-content/60">Global settings for the application.</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<!-- General Settings -->
		<div class="card bg-base-100 border border-base-200">
			<div class="card-body">
				<h3 class="font-bold text-lg mb-4 flex items-center gap-2">
					<Globe class="w-5 h-5" /> General
				</h3>

				<div class="form-control">
					<label class="label cursor-pointer justify-between">
						<span class="label-text font-medium">Maintenance Mode</span>
						<input
							type="checkbox"
							name="maintenanceMode"
							class="toggle toggle-error"
							bind:checked={maintenanceMode}
						/>
					</label>
					<span class="label-text-alt text-base-content/60 px-1"
						>Disable access for non-admin users.</span
					>
				</div>

				<div class="divider my-2"></div>

				<div class="form-control">
					<label class="label cursor-pointer justify-between">
						<span class="label-text font-medium">Public Registration</span>
						<input
							type="checkbox"
							name="registrationOpen"
							class="toggle toggle-success"
							bind:checked={registrationOpen}
						/>
					</label>
					<span class="label-text-alt text-base-content/60 px-1">Allow new users to sign up.</span>
				</div>
			</div>
		</div>

		<!-- Security & Performance -->
		<div class="card bg-base-100 border border-base-200">
			<div class="card-body">
				<h3 class="font-bold text-lg mb-4 flex items-center gap-2">
					<Shield class="w-5 h-5" /> Security & Limits
				</h3>

				<div class="form-control w-full">
					<label class="label" for="timeout">
						<span class="label-text">Session Timeout (minutes)</span>
					</label>
					<input
						type="number"
						name="sessionTimeout"
						id="timeout"
						bind:value={sessionTimeout}
						class="input input-bordered input-sm w-full"
					/>
				</div>

				<div class="form-control w-full mt-4">
					<label class="label" for="upload">
						<span class="label-text">Max Upload Size (MB)</span>
					</label>
					<input
						type="number"
						name="maxUploadSize"
						id="upload"
						bind:value={maxUploadSize}
						class="input input-bordered input-sm w-full"
					/>
				</div>

				<div class="form-control mt-4">
					<label class="label cursor-pointer justify-between">
						<span class="label-text font-medium">Debug Mode</span>
						<input
							type="checkbox"
							name="debugMode"
							class="toggle toggle-warning"
							bind:checked={debugMode}
						/>
					</label>
				</div>
			</div>
		</div>
	</div>

	<div class="flex justify-end">
		<button type="submit" class="btn btn-primary" disabled={isSaving}>
			{#if isSaving}
				<span class="loading loading-spinner loading-xs"></span>
				Saving...
			{:else}
				<Save class="w-4 h-4 mr-2" /> Save Configuration
			{/if}
		</button>
	</div>
</form>
