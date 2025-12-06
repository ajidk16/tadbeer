<script lang="ts">
	import { User, Mail, Phone, MapPin, Calendar, Edit, Shield, LogOut } from 'lucide-svelte';

	import { page } from '$app/state';
	import { enhance } from '$app/forms';

	import { superForm } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import { profileSchema, securitySchema } from '$lib/schemas';
	import { success as toastSuccess, error as toastError } from '$lib/components/ui';

	let { user, sessions, profileForm, securityForm } = $derived(page.data);

	const {
		form: pForm,
		errors: pErrors,
		enhance: pEnhance,
		message: pMessage
	} = superForm(profileForm, {
		validators: valibotClient(profileSchema),
		onResult: ({ result }) => {
			if (result.type === 'success') {
				(document.getElementById('edit_profile_modal') as HTMLDialogElement).close();
				toastSuccess(result.data?.message || 'Profile updated successfully');
			} else if (result.type === 'failure') {
				toastError(result.data?.message || 'Failed to update profile');
			}
		}
	});

	const {
		form: sForm,
		errors: sErrors,
		enhance: sEnhance,
		message: sMessage,
		reset: sReset
	} = superForm(securityForm, {
		validators: valibotClient(securitySchema),
		onResult: ({ result }) => {
			if (result.type === 'success') {
				(document.getElementById('security_modal') as HTMLDialogElement).close();
				toastSuccess(result.data?.message || 'Password updated successfully');
				sReset();
			} else if (result.type === 'failure') {
				toastError(result.data?.message || 'Failed to update password');
			}
		}
	});

	// Password strength calculation
	let passwordStrength = $derived.by(() => {
		const pwd = $sForm.newPassword;
		let score = 0;
		if (pwd.length > 8) score++;
		if (pwd.match(/[A-Z]/)) score++;
		if (pwd.match(/[0-9]/)) score++;
		if (pwd.match(/[^A-Za-z0-9]/)) score++;
		return score;
	});

	function getStrengthLabel(score: number) {
		switch (score) {
			case 0:
			case 1:
				return { label: 'Weak', color: 'text-error', progress: 'progress-error' };
			case 2:
				return { label: 'Fair', color: 'text-warning', progress: 'progress-warning' };
			case 3:
				return { label: 'Good', color: 'text-info', progress: 'progress-info' };
			case 4:
				return { label: 'Strong', color: 'text-success', progress: 'progress-success' };
			default:
				return { label: 'Weak', color: 'text-error', progress: 'progress-error' };
		}
	}
</script>

<div class="max-w-4xl mx-auto space-y-6 p-4 md:p-6">
	<!-- Profile Header -->
	<div class="card bg-base-100 shadow-sm border border-base-200 overflow-hidden">
		<div class="h-32 bg-linear-to-r from-primary to-secondary"></div>
		<div class="card-body pt-0 relative">
			<div
				class="flex flex-col md:flex-row justify-between items-start md:items-end -mt-12 mb-4 gap-4"
			>
				<div class="flex items-end gap-4">
					<div class="avatar placeholder ring ring-base-100 ring-offset-2 rounded-full">
						<div class="bg-neutral text-neutral-content rounded-full w-24 text-3xl">
							<img
								src={user.avatarUrl ||
									`https://ui-avatars.com/api/?name=${user.fullName}&background=random`}
								alt={user.fullName}
							/>
						</div>
					</div>
					<div class="mb-1">
						<h1 class="text-2xl font-bold">{user.fullName}</h1>
						<span class="badge badge-primary badge-outline capitalize"
							>{user.role?.name || 'User'}</span
						>
					</div>
				</div>
				<div class="flex gap-2 w-full md:w-auto">
					<button
						class="btn btn-outline btn-sm flex-1 md:flex-none"
						onclick={() =>
							(document.getElementById('edit_profile_modal') as HTMLDialogElement).showModal()}
					>
						<Edit class="w-4 h-4 mr-1" /> Edit Profile
					</button>
					<button
						class="btn btn-outline btn-sm flex-1 md:flex-none"
						onclick={() =>
							(document.getElementById('security_modal') as HTMLDialogElement).showModal()}
					>
						<Shield class="w-4 h-4 mr-1" /> Security
					</button>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
				<div class="space-y-3">
					<h3 class="font-semibold text-lg">About</h3>
					<p class="text-base-content/70">{user.about || 'No bio provided.'}</p>

					<div class="flex flex-col gap-2 mt-4">
						<div class="flex items-center gap-3 text-sm text-base-content/70">
							<Mail class="w-4 h-4" />
							{user.username}
						</div>
						<div class="flex items-center gap-3 text-sm text-base-content/70">
							<Phone class="w-4 h-4" />
							{user.phone || '-'}
						</div>
						<div class="flex items-center gap-3 text-sm text-base-content/70">
							<MapPin class="w-4 h-4" />
							Jakarta, Indonesia
						</div>
						<div class="flex items-center gap-3 text-sm text-base-content/70">
							<Calendar class="w-4 h-4" /> Joined {new Date(user.createdAt).toLocaleDateString()}
						</div>
					</div>
				</div>

				<div class="space-y-3">
					<h3 class="font-semibold text-lg">Activity Summary</h3>
					<div
						class="stats stats-vertical lg:stats-horizontal shadow w-full border border-base-200"
					>
						<div class="stat">
							<div class="stat-title">Donations</div>
							<div class="stat-value text-primary">12</div>
							<div class="stat-desc">Last month</div>
						</div>
						<div class="stat">
							<div class="stat-title">Events</div>
							<div class="stat-value text-secondary">5</div>
							<div class="stat-desc">Attended</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Recent Activity (Placeholder) -->
	<div class="card bg-base-100 shadow-sm border border-base-200">
		<div class="card-body">
			<h3 class="font-semibold text-lg mb-4">Recent Login Activity</h3>
			<div class="overflow-x-auto">
				<table class="table table-zebra">
					<thead>
						<tr>
							<th>Device</th>
							<th>Location</th>
							<th>Time</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{#each sessions as session}
							<tr>
								<td>
									<div class="flex items-center gap-2">
										<div class="badge badge-ghost badge-sm">ID: {session.id.slice(0, 8)}...</div>
									</div>
								</td>
								<td>-</td>
								<td>{new Date(session.expiresAt).toLocaleString()}</td>
								<td>
									<form action="?/revokeSession" method="POST" use:enhance>
										<input type="hidden" name="sessionId" value={session.id} />
										<button class="btn btn-ghost btn-xs text-error">Revoke</button>
									</form>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>

	<div class="flex justify-center">
		<form action="?/signOut" method="POST">
			<button type="submit" class="btn btn-error btn-outline btn-wide">
				<LogOut class="w-4 h-4 mr-2" /> Sign Out
			</button>
		</form>
	</div>
</div>

<!-- Edit Profile Modal -->
<dialog id="edit_profile_modal" class="modal">
	<div class="modal-box">
		<h3 class="font-bold text-lg mb-4">Edit Profile</h3>
		<form method="POST" action="?/updateProfile" use:pEnhance class="space-y-4">
			<div class="form-control w-full">
				<label class="label" for="fullName">
					<span class="label-text">Full Name</span>
				</label>
				<input
					type="text"
					name="fullName"
					bind:value={$pForm.fullName}
					class="input input-bordered w-full"
				/>
				{#if $pErrors.fullName}<span class="text-error text-sm">{$pErrors.fullName}</span>{/if}
			</div>

			<div class="form-control w-full">
				<label class="label" for="phone">
					<span class="label-text">Phone Number</span>
				</label>
				<input
					type="text"
					name="phone"
					bind:value={$pForm.phone}
					class="input input-bordered w-full"
				/>
				{#if $pErrors.phone}<span class="text-error text-sm">{$pErrors.phone}</span>{/if}
			</div>

			<div class="form-control w-full">
				<label class="label" for="about">
					<span class="label-text">About</span>
				</label>
				<textarea
					name="about"
					bind:value={$pForm.about}
					class="textarea textarea-bordered h-32"
					placeholder="Tell us a bit about yourself..."
				></textarea>
				{#if $pErrors.about}<span class="text-error text-sm">{$pErrors.about}</span>{/if}
			</div>

			<div class="modal-action">
				<button
					type="button"
					class="btn"
					onclick={() =>
						(document.getElementById('edit_profile_modal') as HTMLDialogElement).close()}
					>Cancel</button
				>
				<button type="submit" class="btn btn-primary">Save Changes</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>

<!-- Security Modal -->
<dialog id="security_modal" class="modal">
	<div class="modal-box">
		<h3 class="font-bold text-lg mb-4">Security Settings</h3>
		<form method="POST" action="?/updatePassword" use:sEnhance class="space-y-4">
			<div class="form-control w-full">
				<label class="label" for="currentPassword">
					<span class="label-text">Current Password</span>
				</label>
				<input
					type="password"
					name="currentPassword"
					bind:value={$sForm.currentPassword}
					class="input input-bordered w-full"
				/>
				{#if $sErrors.currentPassword}<span class="text-error text-sm"
						>{$sErrors.currentPassword}</span
					>{/if}
			</div>

			<div class="divider"></div>

			<div class="form-control w-full">
				<label class="label" for="newPassword">
					<span class="label-text">New Password</span>
				</label>
				<input
					type="password"
					name="newPassword"
					bind:value={$sForm.newPassword}
					class="input input-bordered w-full"
				/>
				{#if $sErrors.newPassword}<span class="text-error text-sm">{$sErrors.newPassword}</span
					>{/if}

				<!-- Password Strength Meter -->
				{#if $sForm.newPassword}
					<div class="mt-2">
						<div class="flex justify-between text-xs mb-1">
							<span>Strength</span>
							<span class={getStrengthLabel(passwordStrength).color}>
								{getStrengthLabel(passwordStrength).label}
							</span>
						</div>
						<progress
							class="progress w-full {getStrengthLabel(passwordStrength).progress}"
							value={passwordStrength}
							max="4"
						></progress>
					</div>
				{/if}
			</div>

			<div class="form-control w-full">
				<label class="label" for="confirmPassword">
					<span class="label-text">Confirm New Password</span>
				</label>
				<input
					type="password"
					name="confirmPassword"
					bind:value={$sForm.confirmPassword}
					class="input input-bordered w-full"
				/>
				{#if $sErrors.confirmPassword}<span class="text-error text-sm"
						>{$sErrors.confirmPassword}</span
					>{/if}
			</div>

			<div class="modal-action">
				<button
					type="button"
					class="btn"
					onclick={() => (document.getElementById('security_modal') as HTMLDialogElement).close()}
					>Cancel</button
				>
				<button type="submit" class="btn btn-primary">Update Password</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
