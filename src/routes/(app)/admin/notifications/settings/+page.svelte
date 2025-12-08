<script lang="ts">
	import { ArrowLeft, Bell, Mail, Smartphone, Save } from 'lucide-svelte';
	import { superForm } from 'sveltekit-superforms';
	import { Toast, success as toastSuccess, error as toastError } from '$lib/components/ui';

	let { data } = $props();

	const { form, errors, enhance, submitting } = superForm(data.form, {
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toastSuccess(result.data?.message || 'Settings saved successfully');
			} else if (result.type === 'failure') {
				toastError(result.data?.message || 'Failed to save settings');
			}
		}
	});
</script>

<Toast />

<div class="max-w-2xl mx-auto space-y-6 p-4 md:p-6">
	<div class="flex items-center gap-4 mb-6">
		<a href="/admin/notifications" class="btn btn-ghost btn-circle btn-sm">
			<ArrowLeft class="w-5 h-5" />
		</a>
		<div>
			<h1 class="text-2xl font-bold">Notification Settings</h1>
			<p class="text-base-content/60">Manage how you receive updates.</p>
		</div>
	</div>

	<form method="POST" action="?/updateSettings" use:enhance>
		<div class="card bg-base-100 shadow-sm border border-base-200">
			<div class="card-body">
				<h3 class="font-semibold text-lg mb-4 flex items-center gap-2">
					<Mail class="w-5 h-5" /> Email Notifications
				</h3>

				<div class="form-control">
					<label class="label cursor-pointer justify-start gap-4">
						<input
							type="checkbox"
							name="activityUpdates"
							class="toggle toggle-primary"
							bind:checked={$form.activityUpdates}
						/>
						<div>
							<span class="label-text font-medium block">Activity Updates</span>
							<span class="label-text-alt text-base-content/60"
								>Get notified about new donations, comments, and system events.</span
							>
						</div>
					</label>
				</div>

				<div class="divider my-2"></div>

				<div class="form-control">
					<label class="label cursor-pointer justify-start gap-4">
						<input
							type="checkbox"
							name="marketingTips"
							class="toggle toggle-primary"
							bind:checked={$form.marketingTips}
						/>
						<div>
							<span class="label-text font-medium block">Marketing & Tips</span>
							<span class="label-text-alt text-base-content/60"
								>Receive tips on how to manage your masjid effectively.</span
							>
						</div>
					</label>
				</div>
			</div>
		</div>

		<div class="card bg-base-100 shadow-sm border border-base-200 mt-6">
			<div class="card-body">
				<h3 class="font-semibold text-lg mb-4 flex items-center gap-2">
					<Smartphone class="w-5 h-5" /> Push Notifications
				</h3>

				<div class="form-control">
					<label class="label cursor-pointer justify-start gap-4">
						<input
							type="checkbox"
							name="realtimeAlerts"
							class="toggle toggle-primary"
							bind:checked={$form.realtimeAlerts}
						/>
						<div>
							<span class="label-text font-medium block">Real-time Alerts</span>
							<span class="label-text-alt text-base-content/60"
								>Receive instant notifications on your device.</span
							>
						</div>
					</label>
				</div>

				<div class="divider my-2"></div>

				<div class="form-control">
					<label class="label cursor-pointer justify-start gap-4">
						<input
							type="checkbox"
							name="securityAlerts"
							class="toggle toggle-primary"
							bind:checked={$form.securityAlerts}
							disabled
						/>
						<!-- Hidden input to submit the value even if disabled, or handle in backend if it's always true -->
						<input type="hidden" name="securityAlerts" value="true" />
						<div>
							<span class="label-text font-medium block">Security Alerts</span>
							<span class="label-text-alt text-base-content/60"
								>Critical security notifications cannot be disabled.</span
							>
						</div>
					</label>
				</div>
			</div>
		</div>

		<div class="flex justify-end mt-6">
			<button class="btn btn-primary" disabled={$submitting}>
				{#if $submitting}
					<span class="loading loading-spinner loading-sm"></span>
				{:else}
					<Save class="w-4 h-4 mr-2" />
				{/if}
				Save Preferences
			</button>
		</div>
	</form>
</div>
