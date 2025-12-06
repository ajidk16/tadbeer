<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Search, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-svelte';

	export let data;

	let searchTerm = $page.url.searchParams.get('search') || '';
	let selectedAction = $page.url.searchParams.get('action') || '';

	function handleSearch() {
		const url = new URL($page.url);
		if (searchTerm) url.searchParams.set('search', searchTerm);
		else url.searchParams.delete('search');
		url.searchParams.set('page', '1');
		goto(url);
	}

	function handleFilter() {
		const url = new URL($page.url);
		if (selectedAction) url.searchParams.set('action', selectedAction);
		else url.searchParams.delete('action');
		url.searchParams.set('page', '1');
		goto(url);
	}

	function changePage(newPage: number) {
		const url = new URL($page.url);
		url.searchParams.set('page', String(newPage));
		goto(url);
	}

	function exportCSV() {
		// Implementation for CSV export would go here
		// Typically involves fetching all data matching current filters and triggering a download
		alert('Export functionality coming soon!');
	}
</script>

<svelte:head>
	<title>Audit Logs | Minimasjid</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div>
			<h1 class="text-2xl font-bold">Audit Logs</h1>
			<p class="text-base-content/70">Track system activities and changes</p>
		</div>
		<button class="btn btn-outline" on:click={exportCSV}>
			<Download size={20} />
			Export CSV
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
						placeholder="Search by user..."
						bind:value={searchTerm}
						on:change={handleSearch}
					/>
				</label>
				<select
					class="select select-bordered w-full sm:max-w-xs"
					bind:value={selectedAction}
					on:change={handleFilter}
				>
					<option value="">All Actions</option>
					<option value="CREATE">Create</option>
					<option value="UPDATE">Update</option>
					<option value="DELETE">Delete</option>
					<option value="LOGIN">Login</option>
				</select>
			</div>

			<!-- Table -->
			<div class="overflow-x-auto">
				<table class="table table-zebra">
					<thead>
						<tr>
							<th>Timestamp</th>
							<th>User</th>
							<th>Action</th>
							<th>Resource</th>
							<th>Details</th>
						</tr>
					</thead>
					<tbody>
						{#each data.logs as log}
							<tr>
								<td class="whitespace-nowrap text-xs">
									{new Date(log.createdAt).toLocaleString()}
								</td>
								<td>
									<div class="font-bold">{log.user?.fullName || 'System'}</div>
									<div class="text-xs opacity-50">{log.user?.username || '-'}</div>
								</td>
								<td>
									<span
										class="badge badge-sm font-mono"
										class:badge-success={log.action === 'CREATE'}
										class:badge-info={log.action === 'UPDATE'}
										class:badge-error={log.action === 'DELETE'}
										class:badge-ghost={log.action === 'LOGIN'}
									>
										{log.action}
									</span>
								</td>
								<td>
									<div class="font-medium">{log.tableName}</div>
									<div class="text-xs opacity-50">ID: {log.recordId}</div>
								</td>
								<td class="max-w-xs truncate text-xs font-mono opacity-70">
									{#if log.details.newValues}
										{log.details.newValues}
									{:else}
										-
									{/if}
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="5" class="text-center py-8 text-base-content/50">
									No logs found matching your criteria
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Pagination -->
			<div class="p-4 border-t border-base-200 flex justify-between items-center">
				<div class="text-sm text-base-content/70">
					Page {data.pagination.page} of {data.pagination.totalPages}
				</div>
				<div class="join">
					<button
						class="join-item btn btn-sm"
						disabled={data.pagination.page === 1}
						on:click={() => changePage(data.pagination.page - 1)}
					>
						<ChevronLeft size={16} />
					</button>
					<button
						class="join-item btn btn-sm"
						disabled={data.pagination.page === data.pagination.totalPages}
						on:click={() => changePage(data.pagination.page + 1)}
					>
						<ChevronRight size={16} />
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
