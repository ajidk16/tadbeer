<script lang="ts">
	import { enhance } from '$app/forms';
	import { Badge, Toast, success as toastSuccess, error as toastError } from '$lib/components/ui';
	import {
		Plus,
		Search,
		Download,
		Eye,
		SquarePen,
		Trash2,
		X,
		Phone,
		Mail,
		MapPin,
		User,
		Users
	} from 'lucide-svelte';

	let { data } = $props();

	// Filter & search
	let searchQuery = $state('');
	let selectedGender = $state('');
	let selectedStatus = $state('');

	// Modal states
	let showDetailModal = $state(false);
	let showDeleteModal = $state(false);
	let selectedMember = $state<(typeof data.members)[0] | null>(null);

	// Filtered members
	const filteredMembers = $derived(() => {
		let result = data.members || [];
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(m) =>
					m.name.toLowerCase().includes(q) ||
					m.phone?.includes(q) ||
					m.email?.toLowerCase().includes(q)
			);
		}
		if (selectedGender) result = result.filter((m) => m.gender === selectedGender);
		if (selectedStatus) result = result.filter((m) => m.status === selectedStatus);
		return result;
	});

	function getStatusBadge(status: string) {
		return status === 'active' ? 'success' : 'ghost';
	}

	function calculateAge(birthDate: string | null) {
		if (!birthDate) return '-';
		const today = new Date();
		const birth = new Date(birthDate);
		let age = today.getFullYear() - birth.getFullYear();
		const m = today.getMonth() - birth.getMonth();
		if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
		return age + ' tahun';
	}

	function openDetail(member: (typeof data.members)[0]) {
		selectedMember = member;
		showDetailModal = true;
	}

	function openDelete(member: (typeof data.members)[0]) {
		selectedMember = member;
		showDeleteModal = true;
	}

	function handleDelete() {
		return async ({ result, update }: any) => {
			showDeleteModal = false;
			selectedMember = null;
			if (result.type === 'success') {
				toastSuccess('Data jamaah berhasil dihapus');
				await update();
			} else if (result.type === 'failure') {
				toastError(result.data?.error || 'Gagal menghapus');
			}
		};
	}
</script>

<svelte:head>
	<title>Jamaah | MiniMasjid</title>
</svelte:head>

<Toast />

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold">👥 Data Jamaah</h1>
			<p class="text-base-content/60 mt-1">Kelola database anggota masjid</p>
		</div>
		<div class="flex gap-2">
			<div class="dropdown dropdown-end">
				<button class="btn btn-ghost btn-sm">
					<Download class="w-4 h-4" />
					Export
				</button>
				<ul class="dropdown-content menu bg-base-100 rounded-box shadow-lg z-10 w-40 p-2">
					<li><button>Excel (.xlsx)</button></li>
					<li><button>CSV</button></li>
				</ul>
			</div>
			<a href="/jamaah/tambah" class="btn btn-primary btn-sm">
				<Plus class="w-4 h-4" />
				Tambah
			</a>
		</div>
	</div>

	<!-- Stats -->
	<div class="stats stats-vertical sm:stats-horizontal shadow w-full">
		<div class="stat">
			<div class="stat-figure text-primary"><Users class="w-8 h-8" /></div>
			<div class="stat-title">Total Jamaah</div>
			<div class="stat-value text-xl">{data.totalMembers || 0}</div>
		</div>
		<div class="stat">
			<div class="stat-title">Laki-laki</div>
			<div class="stat-value text-xl text-info">{data.maleCount || 0}</div>
		</div>
		<div class="stat">
			<div class="stat-title">Perempuan</div>
			<div class="stat-value text-xl text-secondary">{data.femaleCount || 0}</div>
		</div>
		<div class="stat">
			<div class="stat-title">Aktif</div>
			<div class="stat-value text-xl text-success">{data.activeCount || 0}</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="flex flex-wrap gap-3 items-center">
		<div class="flex-1 min-w-[200px]">
			<label class="input input-bordered input-sm flex items-center gap-2 w-full">
				<Search class="w-4 h-4 text-base-content/50" />
				<input
					type="text"
					placeholder="Cari nama, telepon, email..."
					class="grow"
					bind:value={searchQuery}
				/>
			</label>
		</div>
		<select class="select select-bordered select-sm" bind:value={selectedGender}>
			<option value="">Semua Gender</option>
			<option value="male">Laki-laki</option>
			<option value="female">Perempuan</option>
		</select>
		<select class="select select-bordered select-sm" bind:value={selectedStatus}>
			<option value="">Semua Status</option>
			<option value="active">Aktif</option>
			<option value="inactive">Tidak Aktif</option>
		</select>
	</div>

	<!-- Members Table -->
	<div class="card bg-base-100 shadow-sm">
		<div class="card-body p-0">
			<div class="overflow-x-auto">
				<table class="table">
					<thead>
						<tr>
							<th>Nama</th>
							<th>Kontak</th>
							<th>Gender</th>
							<th>Usia</th>
							<th>Status</th>
							<th class="text-center">Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredMembers() as member (member.id)}
							<tr class="hover:bg-base-200/50">
								<td>
									<div class="flex items-center gap-3">
										<div class="avatar {member.avatar ? '' : 'placeholder'}">
											{#if member.avatar}
												<div class="w-10 rounded-full">
													<img src={member.avatar} alt={member.name} />
												</div>
											{:else}
												<div class="bg-primary/10 text-primary rounded-full w-10">
													<span class="text-sm">{member.name.charAt(0).toUpperCase()}</span>
												</div>
											{/if}
										</div>
										<div>
											<div class="font-medium">{member.name}</div>
											{#if member.nik}
												<div class="text-xs text-base-content/50">NIK: {member.nik}</div>
											{/if}
										</div>
									</div>
								</td>
								<td>
									{#if member.phone}
										<div class="flex items-center gap-1 text-sm">
											<Phone class="w-3 h-3" />
											{member.phone}
										</div>
									{/if}
									{#if member.email}
										<div class="flex items-center gap-1 text-xs text-base-content/50">
											<Mail class="w-3 h-3" />
											{member.email}
										</div>
									{/if}
								</td>
								<td>
									<Badge variant={member.gender === 'male' ? 'info' : 'secondary'} size="sm">
										{member.gender === 'male' ? 'L' : 'P'}
									</Badge>
								</td>
								<td class="text-sm">{calculateAge(member.birthDate)}</td>
								<td>
									<Badge variant={getStatusBadge(member.status) as any} size="sm">
										{member.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
									</Badge>
								</td>
								<td>
									<div class="flex justify-center gap-1">
										<button
											class="btn btn-ghost btn-xs btn-square"
											onclick={() => openDetail(member)}
										>
											<Eye class="w-4 h-4" />
										</button>
										<a href="/jamaah/{member.id}/edit" class="btn btn-ghost btn-xs btn-square">
											<SquarePen class="w-4 h-4" />
										</a>
										<button
											class="btn btn-ghost btn-xs btn-square text-error"
											onclick={() => openDelete(member)}
										>
											<Trash2 class="w-4 h-4" />
										</button>
									</div>
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="6" class="text-center py-12 text-base-content/50">
									<p class="text-4xl mb-2">📭</p>
									<p>Tidak ada data jamaah</p>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>

<!-- Detail Modal -->
{#if showDetailModal && selectedMember}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<button
				class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
				onclick={() => {
					showDetailModal = false;
					selectedMember = null;
				}}
			>
				<X class="w-4 h-4" />
			</button>

			<div class="flex items-center gap-4 mb-4">
				<div class="avatar {selectedMember.avatar ? '' : 'placeholder'}">
					{#if selectedMember.avatar}
						<div class="w-16 rounded-full">
							<img src={selectedMember.avatar} alt={selectedMember.name} />
						</div>
					{:else}
						<div class="bg-primary/10 text-primary rounded-full w-16">
							<span class="text-2xl">{selectedMember.name.charAt(0).toUpperCase()}</span>
						</div>
					{/if}
				</div>
				<div>
					<h3 class="font-bold text-xl">{selectedMember.name}</h3>
					<Badge variant={getStatusBadge(selectedMember.status) as any}>
						{selectedMember.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
					</Badge>
				</div>
			</div>

			<div class="space-y-3">
				{#if selectedMember.nik}
					<div class="flex items-center gap-3">
						<User class="w-5 h-5 text-base-content/50" />
						<div>
							<p class="text-xs text-base-content/50">NIK</p>
							<p>{selectedMember.nik}</p>
						</div>
					</div>
				{/if}
				<div class="flex items-center gap-3">
					<User class="w-5 h-5 text-base-content/50" />
					<div>
						<p class="text-xs text-base-content/50">Gender / Usia</p>
						<p>
							{selectedMember.gender === 'male' ? 'Laki-laki' : 'Perempuan'} • {calculateAge(
								selectedMember.birthDate
							)}
						</p>
					</div>
				</div>
				{#if selectedMember.phone}
					<div class="flex items-center gap-3">
						<Phone class="w-5 h-5 text-base-content/50" />
						<div>
							<p class="text-xs text-base-content/50">Telepon</p>
							<p>{selectedMember.phone}</p>
						</div>
					</div>
				{/if}
				{#if selectedMember.email}
					<div class="flex items-center gap-3">
						<Mail class="w-5 h-5 text-base-content/50" />
						<div>
							<p class="text-xs text-base-content/50">Email</p>
							<p>{selectedMember.email}</p>
						</div>
					</div>
				{/if}
				{#if selectedMember.address}
					<div class="flex items-center gap-3">
						<MapPin class="w-5 h-5 text-base-content/50" />
						<div>
							<p class="text-xs text-base-content/50">Alamat</p>
							<p>{selectedMember.address}</p>
						</div>
					</div>
				{/if}
			</div>

			<div class="modal-action">
				<a href="/jamaah/{selectedMember.id}/edit" class="btn btn-primary btn-sm">
					<SquarePen class="w-4 h-4" /> Edit
				</a>
				<button
					class="btn btn-ghost btn-sm"
					onclick={() => {
						showDetailModal = false;
						selectedMember = null;
					}}>Tutup</button
				>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button
				onclick={() => {
					showDetailModal = false;
					selectedMember = null;
				}}>close</button
			>
		</form>
	</dialog>
{/if}

<!-- Delete Modal -->
{#if showDeleteModal && selectedMember}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg text-error">⚠️ Hapus Jamaah</h3>
			<p class="py-4">Apakah Anda yakin ingin menghapus data jamaah ini?</p>
			<div class="bg-base-200 rounded-lg p-4 mb-4">
				<p class="font-medium">{selectedMember.name}</p>
				{#if selectedMember.phone}<p class="text-sm text-base-content/60">
						{selectedMember.phone}
					</p>{/if}
			</div>
			<div class="modal-action">
				<button
					class="btn btn-ghost"
					onclick={() => {
						showDeleteModal = false;
						selectedMember = null;
					}}>Batal</button
				>
				<form method="POST" action="?/delete" use:enhance={() => handleDelete()}>
					<input type="hidden" name="id" value={selectedMember.id} />
					<button type="submit" class="btn btn-error"><Trash2 class="w-4 h-4" /> Hapus</button>
				</form>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button
				onclick={() => {
					showDeleteModal = false;
					selectedMember = null;
				}}>close</button
			>
		</form>
	</dialog>
{/if}
