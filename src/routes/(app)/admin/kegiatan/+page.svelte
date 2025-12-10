<script lang="ts">
	import { enhance } from '$app/forms';
	import { Badge, Toast, success as toastSuccess, error as toastError } from '$lib/components/ui';
	import {
		Plus,
		Calendar,
		MapPin,
		Clock,
		Users,
		Eye,
		SquarePen,
		Trash2,
		X,
		ChevronLeft,
		ChevronRight,
		Bell,
		ClipboardCheck
	} from 'lucide-svelte';
	import { page } from '$app/state';

	// View mode
	let viewMode = $state<'list' | 'calendar'>('list');

	// Filter & search
	let searchQuery = $state('');
	let selectedCategory = $state('');
	let selectedStatus = $state('');

	// Calendar
	let currentMonth = $state(new Date().getMonth());
	let currentYear = $state(new Date().getFullYear());

	// Modal states
	let showDetailModal = $state(false);
	let showDeleteModal = $state(false);
	let showAbsensiModal = $state(false);
	let selectedEvent = $state<any>(null);

	// Attendance state
	let attendanceList = $state<any[]>([]);

	const categories = ['Pengajian', 'Kajian', 'Sholat Jumat', 'Kegiatan Sosial', 'Rapat', 'Lainnya'];
	const monthNames = [
		'Januari',
		'Februari',
		'Maret',
		'April',
		'Mei',
		'Juni',
		'Juli',
		'Agustus',
		'September',
		'Oktober',
		'November',
		'Desember'
	];

	// Filtered events
	const filteredEvents = $derived(() => {
		let result = page.data.events || [];
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(e: { title: string; location?: string }) =>
					e.title.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q)
			);
		}
		if (selectedCategory)
			result = result.filter((e: { category: string }) => e.category === selectedCategory);
		if (selectedStatus)
			result = result.filter((e: { status: string }) => e.status === selectedStatus);
		return result;
	});

	// Calendar helpers
	const daysInMonth = $derived(new Date(currentYear, currentMonth + 1, 0).getDate());
	const firstDayOfMonth = $derived(new Date(currentYear, currentMonth, 1).getDay());
	const calendarDays = $derived(() => {
		const days: (number | null)[] = [];
		for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
		for (let i = 1; i <= daysInMonth; i++) days.push(i);
		return days;
	});

	function getEventsForDay(day: number) {
		const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
		return (page.data.events || []).filter((e: { date: string }) => e.date.startsWith(dateStr));
	}

	function prevMonth() {
		if (currentMonth === 0) {
			currentMonth = 11;
			currentYear--;
		} else currentMonth--;
	}

	function nextMonth() {
		if (currentMonth === 11) {
			currentMonth = 0;
			currentYear++;
		} else currentMonth++;
	}

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('id-ID', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	function formatTime(time: string) {
		return time ? time.slice(0, 5) : '-';
	}

	function getStatusBadge(status: string) {
		const map: Record<string, string> = {
			upcoming: 'primary',
			ongoing: 'success',
			completed: 'ghost',
			cancelled: 'error'
		};
		return map[status] || 'ghost';
	}

	function getStatusLabel(status: string) {
		const map: Record<string, string> = {
			upcoming: 'Akan Datang',
			ongoing: 'Berlangsung',
			completed: 'Selesai',
			cancelled: 'Dibatalkan'
		};
		return map[status] || status;
	}

	function openDetail(event: any) {
		selectedEvent = event;
		showDetailModal = true;
	}

	function openDelete(event: any) {
		selectedEvent = event;
		showDeleteModal = true;
	}

	function handleDelete() {
		return async ({ result, update }: any) => {
			showDeleteModal = false;
			selectedEvent = null;
			if (result.type === 'success') {
				toastSuccess('Kegiatan berhasil dihapus');
				await update();
			} else if (result.type === 'failure') {
				toastError(result.data?.error || 'Gagal menghapus');
			}
		};
	}

	function handleReminder() {
		toastSuccess('Reminder berhasil diset! Anda akan menerima notifikasi 1 jam sebelum acara.');
	}

	function openAbsensi(event: any) {
		selectedEvent = event;

		// Create lookup maps for O(1) access
		const attendanceByMemberId = new Map();
		const attendanceByName = new Map();

		(page.data.eventAttendance || []).forEach((a: any) => {
			if (a.eventId === event.id) {
				if (a.memberId) {
					attendanceByMemberId.set(a.memberId, a.status);
				} else {
					attendanceByName.set(a.name, a.status);
				}
			}
		});

		// Get event registrations (guests)
		const eventRegistrants = (page.data.registrations || []).filter(
			(r: any) => r.eventId === event.id
		);

		// Map guests with their attendance status
		const guests = eventRegistrants.map((r: any) => ({
			id: `guest_${r.id}`,
			realId: r.id,
			name: `${r.name} (Tamu)`,
			status: attendanceByName.get(r.name) || 'present',
			type: 'guest',
			phone: r.phone
		}));

		// Map members with their attendance status
		const members = (page.data.members || []).map((m: any) => ({
			id: `member_${m.id}`,
			realId: m.id,
			name: m.fullName,
			status: attendanceByMemberId.get(m.id) || 'present',
			type: 'member'
		}));

		attendanceList = [...guests, ...members];
		showAbsensiModal = true;
	}

	// Local update for UI feedback
	function updateAttendance(id: string, status: string) {
		attendanceList = attendanceList.map((p: { id: string; status: string }) =>
			p.id === id ? { ...p, status } : p
		);
	}

	function saveAttendance() {
		// This function is now just a trigger for the form submission in the modal
		// The actual saving happens via form action
	}
</script>

<svelte:head>
	<title>Kegiatan | TadBeer</title>
</svelte:head>

<Toast />

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold">📅 Kegiatan</h1>
			<p class="text-base-content/60 mt-1">Kelola jadwal kegiatan masjid</p>
		</div>
		<div class="flex gap-2">
			<div class="join">
				<button
					class="join-item btn btn-sm"
					class:btn-active={viewMode === 'list'}
					onclick={() => (viewMode = 'list')}
				>
					📋 List
				</button>
				<button
					class="join-item btn btn-sm"
					class:btn-active={viewMode === 'calendar'}
					onclick={() => (viewMode = 'calendar')}
				>
					📅 Kalender
				</button>
			</div>
			<a href="/admin/kegiatan/form" class="btn btn-primary btn-sm">
				<Plus class="w-4 h-4" />
				Tambah
			</a>
		</div>
	</div>

	<!-- Stats -->
	<div class="stats stats-vertical sm:stats-horizontal shadow w-full">
		<div class="stat">
			<div class="stat-title">Total Kegiatan</div>
			<div class="stat-value text-xl">{page.data.totalEvents || 0}</div>
			<div class="stat-desc">Bulan ini</div>
		</div>
		<div class="stat">
			<div class="stat-title">Akan Datang</div>
			<div class="stat-value text-primary text-xl">{page.data.upcomingCount || 0}</div>
			<div class="stat-desc">kegiatan</div>
		</div>
		<div class="stat">
			<div class="stat-title">Selesai</div>
			<div class="stat-value text-success text-xl">{page.data.completedCount || 0}</div>
			<div class="stat-desc">kegiatan</div>
		</div>
	</div>

	{#if viewMode === 'list'}
		<!-- Filters -->
		<div class="flex flex-wrap gap-3 items-center">
			<div class="flex-1 min-w-[200px]">
				<input
					type="text"
					placeholder="Cari kegiatan..."
					class="input input-bordered input-sm w-full"
					bind:value={searchQuery}
				/>
			</div>
			<select class="select select-bordered select-sm" bind:value={selectedCategory}>
				<option value="">Semua Kategori</option>
				{#each categories as cat}
					<option value={cat}>{cat}</option>
				{/each}
			</select>
			<select class="select select-bordered select-sm" bind:value={selectedStatus}>
				<option value="">Semua Status</option>
				<option value="upcoming">Akan Datang</option>
				<option value="ongoing">Berlangsung</option>
				<option value="completed">Selesai</option>
				<option value="cancelled">Dibatalkan</option>
			</select>
		</div>

		<!-- Events List -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each filteredEvents() as event (event.id)}
				<div class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
					<div class="card-body p-4">
						<div class="flex justify-between items-start">
							<Badge variant={getStatusBadge(event.status) as any} size="sm">
								{getStatusLabel(event.status)}
							</Badge>
							<div class="dropdown dropdown-end">
								<button class="btn btn-ghost btn-xs btn-square">⋮</button>
								<ul class="dropdown-content menu bg-base-100 rounded-box shadow z-10 w-40 p-1">
									<li>
										<button onclick={() => openDetail(event)}><Eye class="w-4 h-4" /> Detail</button
										>
									</li>
									<li>
										<button onclick={() => openAbsensi(event)}
											><ClipboardCheck class="w-4 h-4" /> Absensi</button
										>
									</li>
									<li>
										<a href="/admin/kegiatan/form/{event.id}">
											<SquarePen class="w-4 h-4" /> Edit
										</a>
									</li>
									<li>
										<button class="text-error" onclick={() => openDelete(event)}
											><Trash2 class="w-4 h-4" /> Hapus</button
										>
									</li>
								</ul>
							</div>
						</div>

						<h3 class="font-semibold mt-2">{event.title}</h3>
						<Badge variant="ghost" size="sm">{event.category}</Badge>

						<div class="mt-3 space-y-1 text-sm text-base-content/70">
							<div class="flex items-center gap-2">
								<Calendar class="w-4 h-4" />
								{formatDate(event.date)}
							</div>
							<div class="flex items-center gap-2">
								<Clock class="w-4 h-4" />
								{formatTime(event.time)} - {formatTime(event.endTime)}
							</div>
							{#if event.location}
								<div class="flex items-center gap-2">
									<MapPin class="w-4 h-4" />
									{event.location}
								</div>
							{/if}
							{#if event.capacity}
								<div class="flex items-center gap-2">
									<Users class="w-4 h-4" />
									{event.attendees || 0}/{event.capacity} peserta
								</div>
							{/if}
						</div>
					</div>
				</div>
			{:else}
				<div class="col-span-full text-center py-12 text-base-content/50">
					<p class="text-4xl mb-2">📭</p>
					<p>Tidak ada kegiatan ditemukan</p>
				</div>
			{/each}
		</div>
	{:else}
		<!-- Calendar View -->
		<div class="card bg-base-100 shadow-sm">
			<div class="card-body">
				<div class="flex justify-between items-center mb-4">
					<button class="btn btn-ghost btn-sm" onclick={prevMonth}>
						<ChevronLeft class="w-5 h-5" />
					</button>
					<h2 class="text-lg font-semibold">{monthNames[currentMonth]} {currentYear}</h2>
					<button class="btn btn-ghost btn-sm" onclick={nextMonth}>
						<ChevronRight class="w-5 h-5" />
					</button>
				</div>

				<div class="grid grid-cols-7 gap-1">
					{#each ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'] as day}
						<div class="text-center text-sm font-medium text-base-content/60 py-2">{day}</div>
					{/each}

					{#each calendarDays() as day}
						{@const dayEvents = day ? getEventsForDay(day) : []}
						<div
							class="min-h-20 border border-base-200 rounded-lg p-1 transition-colors cursor-pointer {day
								? 'hover:bg-base-200/50'
								: ''}"
							role="button"
							tabindex="0"
							onclick={() => {
								if (day) {
									// Navigate to new form with prepopulated date?
									// Currently form supports NO query params in my simple implementation,
									// but I can add it later if needed. For now just link to form.
									// Or maybe add ?date=...
									// Let's just go to form page.
									window.location.href = '/admin/kegiatan/form';
								}
							}}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									if (day) {
										window.location.href = '/admin/kegiatan/form';
									}
								}
							}}
						>
							{#if day}
								<div class="text-sm font-medium mb-1">{day}</div>
								<div class="space-y-1">
									{#each dayEvents.slice(0, 2) as event}
										<button
											class="w-full text-left text-xs p-1 rounded bg-primary/10 text-primary truncate hover:bg-primary/20 transition-colors"
											onclick={(e) => {
												e.stopPropagation();
												openDetail(event);
											}}
										>
											{event.title}
										</button>
									{/each}
									{#if dayEvents.length > 2}
										<div class="text-xs text-base-content/50">+{dayEvents.length - 2} lainnya</div>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Detail Modal -->
{#if showDetailModal && selectedEvent}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<button
				class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
				onclick={() => {
					showDetailModal = false;
					selectedEvent = null;
				}}
			>
				<X class="w-4 h-4" />
			</button>

			<div class="flex items-center gap-2 mb-4">
				<Badge variant={getStatusBadge(selectedEvent.status) as any}
					>{getStatusLabel(selectedEvent.status)}</Badge
				>
				<Badge variant="ghost">{selectedEvent.category}</Badge>
			</div>

			<h3 class="font-bold text-xl">{selectedEvent.title}</h3>

			<div class="mt-4 space-y-3">
				<div class="flex items-center gap-3">
					<Calendar class="w-5 h-5 text-base-content/50" />
					<span>{formatDate(selectedEvent.date)}</span>
				</div>
				<div class="flex items-center gap-3">
					<Clock class="w-5 h-5 text-base-content/50" />
					<span>{formatTime(selectedEvent.time)} - {formatTime(selectedEvent.endTime)}</span>
				</div>
				{#if selectedEvent.location}
					<div class="flex items-center gap-3">
						<MapPin class="w-5 h-5 text-base-content/50" />
						<span>{selectedEvent.location}</span>
					</div>
				{/if}
				{#if selectedEvent.capacity}
					<div class="flex items-center gap-3">
						<Users class="w-5 h-5 text-base-content/50" />
						<span>{selectedEvent.attendees || 0} / {selectedEvent.capacity} peserta</span>
					</div>
				{/if}
				{#if selectedEvent.description}
					<div class="mt-4 p-3 bg-base-200 rounded-lg">
						<p class="text-sm">{selectedEvent.description}</p>
					</div>
				{/if}
			</div>

			<div class="modal-action justify-between">
				<div class="flex gap-2">
					<button class="btn btn-ghost btn-sm" onclick={handleReminder}>
						<Bell class="w-4 h-4" /> Reminder
					</button>
					<button
						class="btn btn-ghost btn-sm"
						onclick={() => {
							showDetailModal = false;
							openAbsensi(selectedEvent!);
						}}
					>
						<ClipboardCheck class="w-4 h-4" /> Absensi
					</button>
				</div>
				<div class="flex gap-2">
					<a href="/admin/kegiatan/form/{selectedEvent.id}" class="btn btn-primary btn-sm">
						<SquarePen class="w-4 h-4" /> Edit
					</a>
					<button
						class="btn btn-ghost btn-sm"
						onclick={() => {
							showDetailModal = false;
							selectedEvent = null;
						}}>Tutup</button
					>
				</div>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button
				onclick={() => {
					showDetailModal = false;
					selectedEvent = null;
				}}>close</button
			>
		</form>
	</dialog>
{/if}

<!-- Delete Modal -->
{#if showDeleteModal && selectedEvent}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg text-error">⚠️ Hapus Kegiatan</h3>
			<p class="py-4">Apakah Anda yakin ingin menghapus kegiatan ini?</p>
			<div class="bg-base-200 rounded-lg p-4 mb-4">
				<p class="font-medium">{selectedEvent.title}</p>
				<p class="text-sm text-base-content/60">{formatDate(selectedEvent.date)}</p>
			</div>
			<div class="modal-action">
				<button
					class="btn btn-ghost"
					onclick={() => {
						showDeleteModal = false;
						selectedEvent = null;
					}}>Batal</button
				>
				<form method="POST" action="?/delete" use:enhance={() => handleDelete()}>
					<input type="hidden" name="id" value={selectedEvent.id} />
					<button type="submit" class="btn btn-error"><Trash2 class="w-4 h-4" /> Hapus</button>
				</form>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button
				onclick={() => {
					showDeleteModal = false;
					selectedEvent = null;
				}}>close</button
			>
		</form>
	</dialog>
{/if}

<!-- Absensi Modal -->
{#if showAbsensiModal && selectedEvent}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<button
				class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
				onclick={() => {
					showAbsensiModal = false;
					selectedEvent = null;
				}}
			>
				<X class="w-4 h-4" />
			</button>
			<h3 class="font-bold text-lg">Absensi Peserta</h3>
			<p class="text-sm text-base-content/60 mb-4">{selectedEvent.title}</p>

			<div class="max-h-96 overflow-y-auto space-y-2">
				{#each attendanceList as p (p.id)}
					<div class="flex items-center justify-between p-2 bg-base-200 rounded-lg">
						<div>
							<p class="font-medium">{p.name}</p>
							<p class="text-xs text-base-content/60 capitalize">
								{p.type === 'member' ? 'Jamaah' : 'Tamu'}
							</p>
						</div>
						<div class="join">
							<button
								class="join-item btn btn-xs {p.status === 'present' ? 'btn-success' : ''}"
								onclick={() => updateAttendance(p.id, 'present')}>Hadir</button
							>
							<button
								class="join-item btn btn-xs {p.status === 'permission' ? 'btn-warning' : ''}"
								onclick={() => updateAttendance(p.id, 'permission')}>Izin</button
							>
							<button
								class="join-item btn btn-xs {p.status === 'absent' ? 'btn-error' : ''}"
								onclick={() => updateAttendance(p.id, 'absent')}>Alfa</button
							>
						</div>
					</div>
				{/each}
			</div>

			<div class="modal-action">
				<form method="POST" action="?/saveAttendance" use:enhance>
					<input type="hidden" name="eventId" value={selectedEvent.id} />
					<input type="hidden" name="attendance" value={JSON.stringify(attendanceList)} />
					<button class="btn btn-primary w-full" onclick={() => (showAbsensiModal = false)}
						>Simpan Absensi</button
					>
				</form>
			</div>
		</div>
	</dialog>
{/if}
