<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import { roleSchema } from '$lib/schemas';
	import { Shield, Plus, Edit, Trash2, Check } from 'lucide-svelte';
	import { success as toastSuccess, error as toastError } from '$lib/components/ui';
	import { enhance as formEnhance } from '$app/forms';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	const { form, errors, enhance, message, reset } = superForm(page.data.form, {
		validators: valibotClient(roleSchema),
		onResult: ({ result }) => {
			if (result.type === 'success') {
				(document.getElementById('role_modal') as HTMLDialogElement).close();
				showToast(result.data?.message || 'Operation successful');
			}
		}
	});

	let isEditing = $state(false);
	let toastMessage = $state('');
	let showToastNotification = $state(false);

	function showToast(msg: string) {
		toastMessage = msg;
		showToastNotification = true;
		setTimeout(() => {
			showToastNotification = false;
		}, 3000);
	}

	function openAddModal() {
		isEditing = false;
		reset();
		(document.getElementById('role_modal') as HTMLDialogElement).showModal();
	}

	function openEditModal(role: any) {
		isEditing = true;
		reset();
		$form.id = role.id;
		$form.name = role.name;
		$form.description = role.description;
		$form.permissions = role.permissions || [];
		(document.getElementById('role_modal') as HTMLDialogElement).showModal();
	}

	let permissions = page.data.permissions;

	let groupedPermissions = $derived(
		permissions.reduce((acc: any, perm: any) => {
			if (!acc[perm.group]) acc[perm.group] = [];
			acc[perm.group].push(perm);
			return acc;
		}, {})
	);

	let selectedRole = $state<any>(null);
	let showDeleteModal = $state(false);
	let activeRoleId = $state<number | null>(null);
	let activeRole = $derived(
		page.data.roles.find((r: any) => r.id === activeRoleId) || page.data.roles[0]
	);
	let isSavingPermissions = $state(false);

	function handleDelete() {
		return async ({ result, update }: any) => {
			showDeleteModal = false;
			selectedRole = null;
			if (result.type === 'success') {
				toastSuccess('Data role berhasil dihapus');
				await update();
			} else if (result.type === 'failure') {
				toastError(result.data?.error || 'Gagal menghapus');
			}
		};
	}

	function handleSavePermissions() {
		isSavingPermissions = true;
		return async ({ result, update }: any) => {
			isSavingPermissions = false;
			if (result.type === 'success') {
				toastSuccess('Permissions updated successfully');
				await update();
			} else if (result.type === 'failure') {
				toastError(result.data?.message || 'Failed to update permissions');
			}
		};
	}
</script>

<svelte:head>
	<title>Role Management | Minimasjid</title>
</svelte:head>

{#if showToastNotification}
	<div class="toast toast-end z-50">
		<div class="alert alert-success">
			<span>{toastMessage}</span>
		</div>
	</div>
{/if}

<div class="space-y-6">
	<div class="flex justify-between items-center border-b border-base-200 pb-4">
		<div>
			<h2 class="text-2xl font-bold">Role Management</h2>
			<p class="text-base-content/60">Define roles and assign permissions.</p>
		</div>
		<div class="">
			<button class="btn btn-primary btn-sm" onclick={openAddModal}>
				<Plus class="w-4 h-4 mr-1" /> Add Role
			</button>
			<button
				class="btn btn-secondary btn-sm"
				onclick={() => {
					goto('/admin/settings/roles/permissions');
				}}
			>
				<Check class="w-4 h-4 mr-1" /> Manage Permissions
			</button>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Roles List -->
		<div class="lg:col-span-1 space-y-4">
			{#each page.data.roles as role}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="card bg-base-100 border border-base-200 hover:border-primary cursor-pointer transition-colors"
					class:border-primary={activeRole?.id === role.id}
					class:ring-2={activeRole?.id === role.id}
					class:ring-primary={activeRole?.id === role.id}
					onclick={() => {
						activeRoleId = role.id;
						setTimeout(() => {
							document
								.getElementById('permissions-section')
								?.scrollIntoView({ behavior: 'smooth' });
						}, 100);
					}}
				>
					<div class="card-body p-4">
						<div class="flex justify-between items-start">
							<div>
								<h3 class="font-bold flex items-center gap-2">
									<Shield class="w-4 h-4 text-primary" />
									{role.name}
								</h3>
								<p class="text-xs text-base-content/60 mt-1">{role.description}</p>
							</div>
							<div class="dropdown dropdown-end">
								<button tabindex="0" class="btn btn-ghost btn-xs btn-circle">
									<Edit class="w-3 h-3" />
								</button>
								<ul class="dropdown-content z-1 menu p-2 shadow bg-base-100 rounded-box w-52">
									<li><button onclick={() => openEditModal(role)}>Edit Role</button></li>
									<li>
										<!-- <form action="?/delete" method="POST" use:enhance>
											<input type="hidden" name="id" value={role.id} />
										</form> -->
										<button
											onclick={() => {
												showDeleteModal = true;
												selectedRole = role;
											}}
											class="text-error"
										>
											Delete Role
										</button>
									</li>
								</ul>
							</div>
						</div>
						<div class="mt-3 flex items-center justify-between text-xs text-base-content/50">
							<span>{role.users} Users assigned</span>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Permissions Matrix -->
		<div class="lg:col-span-2 card bg-base-100 border border-base-200">
			<div class="card-body">
				<h3 class="font-bold text-lg mb-4">
					Permissions: {activeRole?.name || 'Select a role'}
				</h3>
				{#if activeRole}
					<form method="POST" action="?/updatePermissions" use:formEnhance={handleSavePermissions}>
						<input type="hidden" name="id" value={activeRole.id} />
						<div id="permissions-section" class="space-y-2">
							{#each Object.entries(groupedPermissions) as [group, perms]}
								<div class="collapse collapse-arrow bg-base-200">
									<input type="checkbox" checked />
									<div class="collapse-title font-bold uppercase text-sm tracking-wider opacity-70">
										{group}
									</div>
									<div class="collapse-content bg-base-100">
										<table class="table table-sm mt-2">
											<tbody>
												{#each perms as perm}
													<tr class="hover">
														<td class="pl-4">
															<div class="font-medium">{perm.name}</div>
															<div class="text-xs opacity-50">{perm.description}</div>
														</td>
														<td class="text-right pr-4">
															<input
																type="checkbox"
																name="permissions"
																value={perm.slug}
																class="checkbox checkbox-primary checkbox-sm"
																checked={activeRole.permissions?.includes(perm.slug)}
															/>
														</td>
													</tr>
												{/each}
											</tbody>
										</table>
									</div>
								</div>
							{/each}
						</div>
						<div class="card-actions justify-end mt-4">
							<button class="btn btn-primary btn-sm" disabled={isSavingPermissions}>
								{#if isSavingPermissions}
									<span class="loading loading-spinner loading-xs"></span>
									Saving...
								{:else}
									Save Permissions
								{/if}
							</button>
						</div>
					</form>
				{:else}
					<div class="text-center py-8 text-base-content/50">
						Select a role from the list to manage permissions
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Role Modal -->
<dialog id="role_modal" class="modal">
	<div class="modal-box">
		<h3 class="font-bold text-lg mb-4">{isEditing ? 'Edit Role' : 'Add New Role'}</h3>
		<form method="POST" action={isEditing ? '?/update' : '?/create'} use:enhance class="space-y-4">
			{#if isEditing}
				<input type="hidden" name="id" bind:value={$form.id} />
			{/if}

			<div class="form-control w-full">
				<label class="label" for="name">
					<span class="label-text">Role Name</span>
				</label>
				<input
					type="text"
					name="name"
					bind:value={$form.name}
					class="input input-bordered w-full"
					placeholder="e.g. Editor"
				/>
				{#if $errors.name}<span class="text-error text-sm">{$errors.name}</span>{/if}
			</div>

			<div class="form-control w-full">
				<label class="label" for="description">
					<span class="label-text">Description</span>
				</label>
				<textarea
					name="description"
					bind:value={$form.description}
					class="textarea textarea-bordered w-full"
					placeholder="Describe the role's responsibilities"
				></textarea>
			</div>

			<div class="modal-action">
				<button
					type="button"
					class="btn"
					onclick={() => (document.getElementById('role_modal') as HTMLDialogElement).close()}
					>Cancel</button
				>
				<button type="submit" class="btn btn-primary"
					>{isEditing ? 'Update Role' : 'Create Role'}</button
				>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>

<!-- modal delete -->
{#if showDeleteModal && selectedRole}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg text-error">⚠️ Hapus Role</h3>
			<p class="py-4">Apakah Anda yakin ingin menghapus data role ini?</p>
			<div class="bg-base-200 rounded-lg p-4 mb-4">
				<p class="font-medium">{selectedRole.name}</p>
				{#if selectedRole.phone}<p class="text-sm text-base-content/60">
						{selectedRole.phone}
					</p>{/if}
			</div>
			<div class="modal-action">
				<button
					class="btn btn-ghost"
					onclick={() => {
						showDeleteModal = false;
						selectedRole = null;
					}}>Batal</button
				>
				<form method="POST" action="?/delete" use:formEnhance={() => handleDelete()}>
					<input type="hidden" name="id" value={selectedRole.id} />
					<button type="submit" class="btn btn-error"><Trash2 class="w-4 h-4" /> Hapus</button>
				</form>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button
				onclick={() => {
					showDeleteModal = false;
					selectedRole = null;
				}}>close</button
			>
		</form>
	</dialog>
{/if}
