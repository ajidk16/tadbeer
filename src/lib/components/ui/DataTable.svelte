<script lang="ts" generics="T extends Record<string, unknown>">
	import { onMount, type Snippet } from 'svelte';

	interface Column<T> {
		key: keyof T | string;
		label: string;
		sortable?: boolean;
		class?: string;
		render?: Snippet<[T]>;
	}

	interface Props<T> {
		data: T[];
		columns: Column<T>[];
		searchable?: boolean;
		searchPlaceholder?: string;
		pageSize?: number;
		emptyMessage?: string;
		striped?: boolean;
	}

	let {
		data,
		columns,
		searchable = true,
		searchPlaceholder = 'Cari...',
		pageSize = 10,
		emptyMessage = 'Tidak ada data',
		striped = true
	}: Props<T> = $props();

	// State
	let searchQuery = $state('');
	let currentPage = $state(1);
	let sortKey = $state<string | null>(null);
	let sortDirection = $state<'asc' | 'desc'>('asc');

	// Filtered data
	const filteredData = $derived(() => {
		let result = [...data];

		// Search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter((item) =>
				columns.some((col) => {
					const value = getNestedValue(item, col.key as string);
					return String(value).toLowerCase().includes(query);
				})
			);
		}

		// Sort
		if (sortKey) {
			const key = sortKey; // Capture for closure
			result.sort((a, b) => {
				const aVal = getNestedValue(a, key);
				const bVal = getNestedValue(b, key);

				if (aVal === bVal) return 0;
				if (aVal === null || aVal === undefined) return 1;
				if (bVal === null || bVal === undefined) return -1;

				const comparison = aVal < bVal ? -1 : 1;
				return sortDirection === 'asc' ? comparison : -comparison;
			});
		}

		return result;
	});

	// Pagination
	const totalPages = $derived(Math.ceil(filteredData().length / pageSize) || 1);
	const paginatedData = $derived(() => {
		const start = (currentPage - 1) * pageSize;
		return filteredData().slice(start, start + pageSize);
	});

	// Helpers
	function getNestedValue(obj: T, path: string): unknown {
		return path.split('.').reduce((acc: unknown, key) => {
			if (acc && typeof acc === 'object' && key in acc) {
				return (acc as Record<string, unknown>)[key];
			}
			return undefined;
		}, obj);
	}

	function toggleSort(key: string) {
		if (sortKey === key) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDirection = 'asc';
		}
		currentPage = 1;
	}

	function goToPage(page: number) {
		currentPage = Math.max(1, Math.min(page, totalPages));
	}

	// Reset page when search changes
	onMount(() => {
		searchQuery;
		currentPage = 1;
	});
</script>

<div class="space-y-4">
	<!-- Search bar -->
	{#if searchable}
		<div class="flex justify-between items-center gap-4">
			<label class="input input-sm input-bordered flex items-center gap-2 w-full max-w-xs">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 opacity-50"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
				<input type="text" placeholder={searchPlaceholder} class="grow" bind:value={searchQuery} />
			</label>
			<span class="text-sm text-base-content/60">
				{filteredData().length} data
			</span>
		</div>
	{/if}

	<!-- Table -->
	<div class="overflow-x-auto">
		<table class="table {striped ? 'table-zebra' : ''} table-pin-rows">
			<thead>
				<tr>
					{#each columns as col}
						<th class={col.class || ''}>
							{#if col.sortable}
								<button
									class="flex items-center gap-1 hover:text-primary transition-colors"
									onclick={() => toggleSort(col.key as string)}
								>
									{col.label}
									<span class="text-xs opacity-50">
										{#if sortKey === col.key}
											{sortDirection === 'asc' ? '↑' : '↓'}
										{:else}
											↕
										{/if}
									</span>
								</button>
							{:else}
								{col.label}
							{/if}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each paginatedData() as row}
					<tr class="hover">
						{#each columns as col}
							<td class={col.class || ''}>
								{#if col.render}
									{@render col.render(row)}
								{:else}
									{getNestedValue(row, col.key as string) ?? '-'}
								{/if}
							</td>
						{/each}
					</tr>
				{:else}
					<tr>
						<td colspan={columns.length} class="text-center py-8 text-base-content/60">
							{emptyMessage}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Pagination -->
	{#if totalPages > 1}
		<div class="flex justify-center">
			<div class="join">
				<button
					class="join-item btn btn-sm"
					disabled={currentPage === 1}
					onclick={() => goToPage(1)}
				>
					«
				</button>
				<button
					class="join-item btn btn-sm"
					disabled={currentPage === 1}
					onclick={() => goToPage(currentPage - 1)}
				>
					‹
				</button>

				{#each Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
					const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
					return start + i;
				}).filter((p) => p <= totalPages) as page}
					<button
						class="join-item btn btn-sm {currentPage === page ? 'btn-primary' : ''}"
						onclick={() => goToPage(page)}
					>
						{page}
					</button>
				{/each}

				<button
					class="join-item btn btn-sm"
					disabled={currentPage === totalPages}
					onclick={() => goToPage(currentPage + 1)}
				>
					›
				</button>
				<button
					class="join-item btn btn-sm"
					disabled={currentPage === totalPages}
					onclick={() => goToPage(totalPages)}
				>
					»
				</button>
			</div>
		</div>
	{/if}
</div>
