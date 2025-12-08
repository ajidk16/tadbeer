<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { Badge, Toast, success as toastSuccess, error as toastError } from '$lib/components/ui';
	import { Plus, Megaphone, Calendar, Trash2, SquarePen, Mic2, Radio, Save } from 'lucide-svelte';

	// Initialize Superforms
	const {
		form: announcementFormData,
		errors: announcementErrors,
		enhance: announcementEnhance,
		submitting: announcementSubmitting
	} = superForm(page.data.announcementForm, {
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toastSuccess(result.data?.message || 'Berhasil disimpan');
				showAnnouncementModal = false;
			} else if (result.type === 'failure') {
				toastError(result.data?.message || 'Gagal menyimpan');
			}
		}
	});

	const {
		form: khutbahFormData,
		errors: khutbahErrors,
		enhance: khutbahEnhance,
		submitting: khutbahSubmitting
	} = superForm(page.data.khutbahForm, {
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toastSuccess(result.data?.message || 'Berhasil disimpan');
				showKhutbahModal = false;
			} else if (result.type === 'failure') {
				toastError(result.data?.message || 'Gagal menyimpan');
			}
		}
	});

	// View state
	let activeTab = $state('announcements'); // announcements, khutbah, broadcast

	// Modal states
	let showAnnouncementModal = $state(false);
	let showKhutbahModal = $state(false);
	let showDeleteModal = $state(false);
	let selectedItem = $state<any>(null);
	let isEditMode = $state(false);

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('id-ID', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	function formatTime(dateStr: string) {
		return new Date(dateStr).toLocaleTimeString('id-ID', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function openAnnouncementModal() {
		selectedItem = null;
		isEditMode = false;
		$announcementFormData = {
			title: '',
			content: '',
			type: 'info'
		};
		showAnnouncementModal = true;
	}

	function openEditAnnouncement(item: any) {
		selectedItem = item;
		isEditMode = true;
		$announcementFormData = {
			id: item.id,
			title: item.title,
			content: item.content,
			type: item.priority || item.type || 'info', // Map priority to type
			imageUrl: item.imageUrl
		};
		showAnnouncementModal = true;
	}

	function openKhutbahModal() {
		selectedItem = null;
		isEditMode = false;
		$khutbahFormData = {
			date: '',
			khatib: '',
			imam: '',
			muadzin: '',
			theme: ''
		};
		showKhutbahModal = true;
	}

	function openEditKhutbah(item: any) {
		selectedItem = item;
		isEditMode = true;
		$khutbahFormData = {
			id: item.id,
			date: item.date,
			khatib: item.khatib,
			imam: item.imam,
			muadzin: item.muadzin,
			theme: item.theme
		};
		showKhutbahModal = true;
	}

	function openDelete(item: any) {
		selectedItem = item;
		showDeleteModal = true;
	}

	// Delete logic is simpler without superform for now, or just use standard enhance
	import { enhance } from '$app/forms';
	import { page } from '$app/state';

	function handleDelete() {
		return async ({ result }: any) => {
			showDeleteModal = false;
			if (result.type === 'success') {
				toastSuccess(result.data?.message || 'Data berhasil dihapus');
			} else {
				toastError(result.data?.message || 'Gagal menghapus');
			}
		};
	}

	const announcement = $derived(page.data.announcements);
	const khutbah = $derived(page.data.khutbahSchedule);
	const broadcast = $derived(page.data.broadcastHistory);
</script>

<svelte:head>
	<title>Pengumuman | TadBeer</title>
</svelte:head>

<Toast />

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold">📢 Pengumuman & Jadwal</h1>
			<p class="text-base-content/60 mt-1">Kelola informasi publik dan jadwal ibadah</p>
		</div>
	</div>

	<!-- Tabs -->
	<div role="tablist" class="tabs tabs-bordered">
		<button
			role="tab"
			class="tab {activeTab === 'announcements' ? 'tab-active' : ''}"
			onclick={() => (activeTab = 'announcements')}
		>
			<Megaphone class="w-4 h-4 mr-2" /> Pengumuman
		</button>
		<button
			role="tab"
			class="tab {activeTab === 'khutbah' ? 'tab-active' : ''}"
			onclick={() => (activeTab = 'khutbah')}
		>
			<Mic2 class="w-4 h-4 mr-2" /> Jadwal Khutbah
		</button>
		<button
			role="tab"
			class="tab {activeTab === 'broadcast' ? 'tab-active' : ''}"
			onclick={() => (activeTab = 'broadcast')}
		>
			<Radio class="w-4 h-4 mr-2" /> Broadcast History
		</button>
	</div>

	{#if activeTab === 'announcements'}
		<div class="space-y-4">
			<div class="flex justify-end">
				<button class="btn btn-primary btn-sm" onclick={openAnnouncementModal}>
					<Plus class="w-4 h-4" /> Buat Pengumuman
				</button>
			</div>

			<div class="grid gap-4">
				{#each announcement as item}
					<div
						class="card bg-base-100 shadow-sm border-l-4 {(item.priority || item.type) === 'urgent'
							? 'border-error'
							: 'border-info'}"
					>
						<div class="card-body p-4">
							<div class="flex justify-between items-start">
								<div>
									<div class="flex items-center gap-2 mb-1">
										<h3 class="font-bold text-lg">{item.title}</h3>
										{#if (item.priority || item.type) === 'urgent'}
											<Badge variant="error" size="sm">Penting</Badge>
										{/if}
									</div>
									<p class="text-base-content/70">{item.content}</p>
									<p class="text-xs text-base-content/50 mt-2">
										Diposting: {formatDate(item.createdAt)}
									</p>
								</div>
								<div class="flex gap-1">
									<button
										class="btn btn-ghost btn-xs btn-square"
										onclick={() => openEditAnnouncement(item)}
									>
										<SquarePen class="w-4 h-4" />
									</button>
									<button
										class="btn btn-ghost btn-xs btn-square text-error"
										onclick={() => openDelete(item)}
									>
										<Trash2 class="w-4 h-4" />
									</button>
								</div>
							</div>
						</div>
					</div>
				{/each}
				{#if announcement.length === 0}
					<div class="text-center py-8 text-base-content/50">Belum ada pengumuman</div>
				{/if}
			</div>
		</div>
	{:else if activeTab === 'khutbah'}
		<div class="space-y-4">
			<div class="flex justify-end">
				<button class="btn btn-primary btn-sm" onclick={openKhutbahModal}>
					<Plus class="w-4 h-4" /> Tambah Jadwal
				</button>
			</div>

			<div class="card bg-base-100 shadow-sm">
				<div class="card-body p-0">
					<div class="overflow-x-auto">
						<table class="table">
							<thead>
								<tr>
									<th>Tanggal</th>
									<th>Khatib & Imam</th>
									<th>Muadzin</th>
									<th>Tema</th>
									<th class="text-center">Aksi</th>
								</tr>
							</thead>
							<tbody>
								{#each khutbah as item}
									<tr class="hover:bg-base-200/50">
										<td class="font-medium">
											<div class="flex items-center gap-2">
												<Calendar class="w-4 h-4 text-base-content/50" />
												{formatDate(item.date)}
											</div>
										</td>
										<td>
											<div class="font-medium">{item.khatib}</div>
											<div class="text-xs text-base-content/50">Imam: {item.imam}</div>
										</td>
										<td>{item.muadzin}</td>
										<td>
											{#if item.theme}
												<Badge variant="ghost" size="sm">{item.theme}</Badge>
											{:else}
												-
											{/if}
										</td>
										<td>
											<div class="flex justify-center gap-1">
												<button
													class="btn btn-ghost btn-xs btn-square"
													onclick={() => openEditKhutbah(item)}
												>
													<SquarePen class="w-4 h-4" />
												</button>
												<button
													class="btn btn-ghost btn-xs btn-square text-error"
													onclick={() => openDelete(item)}
												>
													<Trash2 class="w-4 h-4" />
												</button>
											</div>
										</td>
									</tr>
								{/each}
								{#if khutbah.length === 0}
									<tr>
										<td colspan="5" class="text-center py-8 text-base-content/50"
											>Belum ada jadwal khutbah</td
										>
									</tr>
								{/if}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	{:else if activeTab === 'broadcast'}
		<div class="space-y-4">
			<div class="card bg-base-100 shadow-sm">
				<div class="card-body p-0">
					<div class="overflow-x-auto">
						<table class="table">
							<thead>
								<tr>
									<th>Subjek</th>
									<th>Channel</th>
									<th>Penerima</th>
									<th>Waktu Kirim</th>
									<th>Status</th>
								</tr>
							</thead>
							<tbody>
								{#each broadcast as item}
									<tr class="hover:bg-base-200/50">
										<td class="font-medium">{item.subject}</td>
										<td>
											<Badge variant={item.channel === 'whatsapp' ? 'success' : 'info'} size="sm">
												{item.channel === 'whatsapp' ? 'WhatsApp' : 'Email'}
											</Badge>
										</td>
										<td>{item.recipientCount} orang</td>
										<td class="text-sm">
											{formatDate(item.sentAt)} • {formatTime(item.sentAt)}
										</td>
										<td>
											<Badge variant="success" size="sm">Terkirim</Badge>
										</td>
									</tr>
								{/each}
								{#if broadcast.length === 0}
									<tr>
										<td colspan="5" class="text-center py-8 text-base-content/50"
											>Belum ada history broadcast</td
										>
									</tr>
								{/if}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Announcement Modal -->
{#if showAnnouncementModal}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg mb-4">
				{isEditMode ? '✏️ Edit Pengumuman' : '📢 Buat Pengumuman'}
			</h3>
			<form
				method="POST"
				action={isEditMode ? '?/updateAnnouncement' : '?/createAnnouncement'}
				use:announcementEnhance
			>
				{#if $announcementFormData.id}
					<input type="hidden" name="id" value={$announcementFormData.id} />
				{/if}
				<div class="space-y-4">
					<div class="form-control">
						<label for="title" class="label"><span class="label-text">Judul</span></label>
						<input
							type="text"
							name="title"
							class="input input-bordered w-full"
							bind:value={$announcementFormData.title}
							placeholder="Masukkan judul pengumuman"
						/>
						{#if $announcementErrors.title}
							<span class="text-error text-xs mt-1">{$announcementErrors.title}</span>
						{/if}
					</div>
					<div class="form-control">
						<label for="type" class="label"><span class="label-text">Tipe</span></label>
						<select
							name="type"
							class="select select-bordered w-full"
							bind:value={$announcementFormData.type}
						>
							<option value="info">Info Biasa</option>
							<option value="urgent">Penting / Mendesak</option>
						</select>
						{#if $announcementErrors.type}
							<span class="text-error text-xs mt-1">{$announcementErrors.type}</span>
						{/if}
					</div>
					<div class="form-control">
						<label for="content" class="label"><span class="label-text">Isi Pengumuman</span></label
						>
						<textarea
							name="content"
							class="textarea textarea-bordered h-24 w-full"
							bind:value={$announcementFormData.content}
							placeholder="Tulis detail pengumuman..."
						></textarea>
						{#if $announcementErrors.content}
							<span class="text-error text-xs mt-1">{$announcementErrors.content}</span>
						{/if}
					</div>
				</div>
				<div class="modal-action">
					<button
						type="button"
						class="btn btn-ghost"
						onclick={() => (showAnnouncementModal = false)}>Batal</button
					>
					<button type="submit" class="btn btn-primary" disabled={$announcementSubmitting}>
						{#if $announcementSubmitting}<span class="loading loading-spinner loading-sm"
							></span>{:else}<Save class="w-4 h-4" />{/if}
						Simpan
					</button>
				</div>
			</form>
		</div>
	</dialog>
{/if}

<!-- Khutbah Modal -->
{#if showKhutbahModal}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg mb-4">
				{isEditMode ? '✏️ Edit Jadwal Khutbah' : '🎙️ Jadwal Khutbah Jumat'}
			</h3>
			<form
				method="POST"
				action={isEditMode ? '?/updateKhutbah' : '?/createKhutbah'}
				use:khutbahEnhance
			>
				{#if $khutbahFormData.id}
					<input type="hidden" name="id" value={$khutbahFormData.id} />
				{/if}
				<div class="space-y-4">
					<div class="form-control">
						<label for="date" class="label"><span class="label-text">Tanggal</span></label>
						<input
							type="date"
							name="date"
							class="input input-bordered w-full"
							bind:value={$khutbahFormData.date}
						/>
						{#if $khutbahErrors.date}
							<span class="text-error text-xs mt-1">{$khutbahErrors.date}</span>
						{/if}
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div class="form-control">
							<label for="khatib" class="label"><span class="label-text">Khatib</span></label>
							<input
								type="text"
								name="khatib"
								class="input input-bordered w-full"
								bind:value={$khutbahFormData.khatib}
								placeholder="Nama Khatib"
							/>
							{#if $khutbahErrors.khatib}
								<span class="text-error text-xs mt-1">{$khutbahErrors.khatib}</span>
							{/if}
						</div>
						<div class="form-control">
							<label for="imam" class="label"><span class="label-text">Imam</span></label>
							<input
								type="text"
								name="imam"
								class="input input-bordered w-full"
								bind:value={$khutbahFormData.imam}
								placeholder="Nama Imam"
							/>
							{#if $khutbahErrors.imam}
								<span class="text-error text-xs mt-1">{$khutbahErrors.imam}</span>
							{/if}
						</div>
					</div>
					<div class="form-control">
						<label for="muadzin" class="label"><span class="label-text">Muadzin</span></label>
						<input
							type="text"
							name="muadzin"
							class="input input-bordered w-full"
							bind:value={$khutbahFormData.muadzin}
							placeholder="Nama Muadzin (Opsional)"
						/>
						{#if $khutbahErrors.muadzin}
							<span class="text-error text-xs mt-1">{$khutbahErrors.muadzin}</span>
						{/if}
					</div>
					<div class="form-control">
						<label for="theme" class="label"><span class="label-text">Tema Khutbah</span></label>
						<input
							type="text"
							name="theme"
							class="input input-bordered w-full"
							bind:value={$khutbahFormData.theme}
							placeholder="Tema Khutbah (Opsional)"
						/>
						{#if $khutbahErrors.theme}
							<span class="text-error text-xs mt-1">{$khutbahErrors.theme}</span>
						{/if}
					</div>
				</div>
				<div class="modal-action">
					<button type="button" class="btn btn-ghost" onclick={() => (showKhutbahModal = false)}
						>Batal</button
					>
					<button type="submit" class="btn btn-primary" disabled={$khutbahSubmitting}>
						{#if $khutbahSubmitting}<span class="loading loading-spinner loading-sm"
							></span>{:else}<Save class="w-4 h-4" />{/if}
						Simpan
					</button>
				</div>
			</form>
		</div>
	</dialog>
{/if}

<!-- Delete Modal -->
{#if showDeleteModal}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg text-error">⚠️ Hapus Data</h3>
			<p class="py-4">Apakah Anda yakin ingin menghapus data ini?</p>
			<div class="modal-action">
				<button class="btn btn-ghost" onclick={() => (showDeleteModal = false)}>Batal</button>
				<form
					method="POST"
					action={activeTab === 'announcements' ? '?/deleteAnnouncement' : '?/deleteKhutbah'}
					use:enhance={handleDelete}
				>
					<input type="hidden" name="id" value={selectedItem?.id} />
					<button type="submit" class="btn btn-error"><Trash2 class="w-4 h-4" /> Hapus</button>
				</form>
			</div>
		</div>
	</dialog>
{/if}
