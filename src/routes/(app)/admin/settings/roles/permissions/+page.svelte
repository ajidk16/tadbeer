<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import { permissionSchema } from '$lib/schemas';
	import {
		Plus,
		Edit,
		Trash2,
		Search,
		Filter,
		ChevronLeft,
		ChevronRight,
		Shield,
		ArrowLeft
	} from 'lucide-svelte';
	import { success as toastSuccess, error as toastError } from '$lib/components/ui';
	import { enhance as formEnhance } from '$app/forms';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	const { form, errors, enhance, message, reset } = superForm(page.data.form, {
		validators: valibotClient(permissionSchema),
		onResult: ({ result }) => {
			if (result.type === 'success') {
				(document.getElementById('permission_modal') as HTMLDialogElement).close();
				showToast(result.data?.message || 'Operation successful');
			}
		}
	});

	let isEditing = $state(false);
	let toastMessage = $state('');
	let showToastNotification = $state(false);
	let searchTerm = $state(page.url.searchParams.get('search') || '');
	let selectedGroup = $state(page.url.searchParams.get('group') || '');

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
		(document.getElementById('permission_modal') as HTMLDialogElement).showModal();
	}

	function openEditModal(perm: any) {
		isEditing = true;
		reset();
		$form.id = perm.id;
		$form.slug = perm.slug;
		$form.name = perm.name;
		$form.description = perm.description;
		$form.group = perm.group;
		(document.getElementById('permission_modal') as HTMLDialogElement).showModal();
	}

	let selectedPermission = $state<any>(null);
	let showDeleteModal = $state(false);

	function handleDelete() {
		return async ({ result, update }: any) => {
			showDeleteModal = false;
			selectedPermission = null;
			if (result.type === 'success') {
				toastSuccess('Permission deleted successfully');
				await update();
			} else if (result.type === 'failure') {
				toastError(result.data?.message || 'Failed to delete permission');
			}
		};
	}

	function handleSearch() {
		const url = new URL(page.url);
		if (searchTerm) url.searchParams.set('search', searchTerm);
		else url.searchParams.delete('search');
		url.searchParams.set('page', '1');
		goto(url);
	}

	function handleFilter() {
		const url = new URL(page.url);
		if (selectedGroup) url.searchParams.set('group', selectedGroup);
		else url.searchParams.delete('group');
		url.searchParams.set('page', '1');
		goto(url);
	}

	function changePage(newPage: number) {
		const url = new URL(page.url);
		url.searchParams.set('page', String(newPage));
		goto(url);
	}
</script>

<svelte:head>
	<title>Permission Management | Minimasjid</title>
</svelte:head>

{#if showToastNotification}
	<div class="toast toast-end z-50">
		<div class="alert alert-success">
			<span>{toastMessage}</span>
		</div>
	</div>
{/if}

<div class="space-y-6">
	<div
		class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-base-200 pb-4"
	>
		<div>
			<div class="flex gap-2 items-center">
				<button class="btn btn-ghost btn-sm" onclick={() => history.back()}>
					<ArrowLeft size={24} />
				</button>
				<div>
					<h2 class="text-2xl font-bold">Permission Management</h2>
					<p class="text-base-content/70">
						Manage permissions that can be assigned to roles within the system.
					</p>
				</div>
			</div>
		</div>
		<button class="btn btn-primary btn-sm" onclick={openAddModal}>
			<Plus class="w-4 h-4 mr-1" /> Add Permission
		</button>
	</div>

	<div class="card bg-base-100 shadow-sm border border-base-200">
		<div class="card-body p-0">
			<!-- Toolbar -->
			<div class="p-4 border-b border-base-200 flex flex-col sm:flex-row gap-4">
				<label class="input input-bordered flex items-center gap-2 w-full sm:max-w-xs">
					<Search size={16} class="opacity-70" />
					<input
						type="text"
						class="grow"
						placeholder="Search permissions..."
						bind:value={searchTerm}
						onchange={handleSearch}
					/>
				</label>
				<select
					class="select select-bordered w-full sm:max-w-xs"
					bind:value={selectedGroup}
					onchange={handleFilter}
				>
					<option value="">All Groups</option>
					<option value="users">Users</option>
					<option value="roles">Roles</option>
					<option value="settings">Settings</option>
					<option value="content">Content</option>
					<option value="reports">Reports</option>
				</select>
			</div>

			<!-- Table -->
			<div class="overflow-x-auto">
				<table class="table table-zebra">
					<thead>
						<tr>
							<th>Name / Slug</th>
							<th>Description</th>
							<th>Group</th>
							<th class="text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each page.data.permissions as perm}
							<tr>
								<td>
									<div class="font-bold">{perm.name}</div>
									<div class="text-xs font-mono opacity-50">{perm.slug}</div>
								</td>
								<td class="text-sm opacity-70">{perm.description || '-'}</td>
								<td>
									<span class="badge badge-sm badge-outline uppercase text-xs">{perm.group}</span>
								</td>
								<td class="text-right">
									<div class="join">
										<button
											class="btn btn-ghost btn-xs join-item"
											onclick={() => openEditModal(perm)}
										>
											<Edit class="w-4 h-4" />
										</button>
										<button
											class="btn btn-ghost btn-xs join-item text-error"
											onclick={() => {
												showDeleteModal = true;
												selectedPermission = perm;
											}}
										>
											<Trash2 class="w-4 h-4" />
										</button>
									</div>
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="4" class="text-center py-8 text-base-content/50">
									No permissions found matching your criteria
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Pagination -->
			<div class="p-4 border-t border-base-200 flex justify-between items-center">
				<div class="text-sm text-base-content/70">
					Page {page.data.pagination.page} of {page.data.pagination.totalPages}
				</div>
				<div class="join">
					<button
						class="join-item btn btn-sm"
						disabled={page.data.pagination.page === 1}
						onclick={() => changePage(page.data.pagination.page - 1)}
					>
						<ChevronLeft size={16} />
					</button>
					<button
						class="join-item btn btn-sm"
						disabled={page.data.pagination.page === page.data.pagination.totalPages}
						onclick={() => changePage(page.data.pagination.page + 1)}
					>
						<ChevronRight size={16} />
					</button>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Permission Modal -->
<dialog id="permission_modal" class="modal">
	<div class="modal-box">
		<h3 class="font-bold text-lg mb-4">{isEditing ? 'Edit Permission' : 'Add New Permission'}</h3>
		<form method="POST" action={isEditing ? '?/update' : '?/create'} use:enhance class="space-y-4">
			{#if isEditing}
				<input type="hidden" name="id" bind:value={$form.id} />
			{/if}

			<div class="form-control w-full">
				<label class="label" for="name">
					<span class="label-text">Name</span>
				</label>
				<input
					type="text"
					name="name"
					bind:value={$form.name}
					class="input input-bordered w-full"
					placeholder="e.g. Manage Users"
				/>
				{#if $errors.name}<span class="text-error text-sm">{$errors.name}</span>{/if}
			</div>

			<div class="form-control w-full">
				<label class="label" for="slug">
					<span class="label-text">Slug</span>
				</label>
				<input
					type="text"
					name="slug"
					bind:value={$form.slug}
					class="input input-bordered w-full font-mono"
					placeholder="e.g. manage_users"
				/>
				{#if $errors.slug}<span class="text-error text-sm">{$errors.slug}</span>{/if}
			</div>

			<div class="form-control w-full">
				<label class="label" for="group">
					<span class="label-text">Group</span>
				</label>
				<input
					type="text"
					name="group"
					bind:value={$form.group}
					class="input input-bordered w-full"
					placeholder="e.g. users"
				/>
				{#if $errors.group}<span class="text-error text-sm">{$errors.group}</span>{/if}
			</div>

			<div class="form-control w-full">
				<label class="label" for="description">
					<span class="label-text">Description</span>
				</label>
				<textarea
					name="description"
					bind:value={$form.description}
					class="textarea textarea-bordered w-full"
					placeholder="Describe what this permission allows"
				></textarea>
			</div>

			<div class="modal-action">
				<button
					type="button"
					class="btn"
					onclick={() => (document.getElementById('permission_modal') as HTMLDialogElement).close()}
					>Cancel</button
				>
				<button type="submit" class="btn btn-primary"
					>{isEditing ? 'Update Permission' : 'Create Permission'}</button
				>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>

<!-- Delete Modal -->
{#if showDeleteModal && selectedPermission}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg text-error">⚠️ Delete Permission</h3>
			<p class="py-4">
				Are you sure you want to delete this permission? This action cannot be undone.
			</p>
			<div class="bg-base-200 rounded-lg p-4 mb-4">
				<p class="font-medium">{selectedPermission.name}</p>
				<p class="text-sm font-mono opacity-60">{selectedPermission.slug}</p>
			</div>
			<div class="modal-action">
				<button
					class="btn btn-ghost"
					onclick={() => {
						showDeleteModal = false;
						selectedPermission = null;
					}}>Cancel</button
				>
				<form method="POST" action="?/delete" use:formEnhance={() => handleDelete()}>
					<input type="hidden" name="id" value={selectedPermission.id} />
					<button type="submit" class="btn btn-error"><Trash2 class="w-4 h-4" /> Delete</button>
				</form>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button
				onclick={() => {
					showDeleteModal = false;
					selectedPermission = null;
				}}>close</button
			>
		</form>
	</dialog>
{/if}
