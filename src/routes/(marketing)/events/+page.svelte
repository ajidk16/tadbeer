<script lang="ts">
	import {
		Calendar as CalendarIcon,
		MapPin,
		Clock,
		Users,
		ChevronLeft,
		ChevronRight,
		List,
		Grid,
		X
	} from 'lucide-svelte';
	import { Badge } from '$lib/components/ui';
	import { goto } from '$app/navigation';

	let { data } = $props();

	// State
	let viewMode = $state<'list' | 'calendar'>('list');
	let currentDate = $state(new Date());
	let selectedDate = $state<Date | null>(null);
	let showModal = $state(false);

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

	// Derived
	let events = $derived(data.events || []);

	// Calendar Helpers
	const currentYear = $derived(currentDate.getFullYear());
	const currentMonth = $derived(currentDate.getMonth());

	const daysInMonth = $derived(new Date(currentYear, currentMonth + 1, 0).getDate());
	const firstDayOfMonth = $derived(new Date(currentYear, currentMonth, 1).getDay());

	const calendarDays = $derived.by(() => {
		const days: (number | null)[] = [];
		for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
		for (let i = 1; i <= daysInMonth; i++) days.push(i);
		return days;
	});

	function getEventsForDisplay(date: Date) {
		return events.filter((e) => {
			const eDate = new Date(e.startTime);
			return (
				eDate.getDate() === date.getDate() &&
				eDate.getMonth() === date.getMonth() &&
				eDate.getFullYear() === date.getFullYear()
			);
		});
	}

	function getEventsForDay(day: number) {
		return getEventsForDisplay(new Date(currentYear, currentMonth, day));
	}

	function formatDate(date: Date | string) {
		return new Intl.DateTimeFormat('id-ID', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		}).format(new Date(date));
	}

	function formatTime(date: Date | string) {
		return new Intl.DateTimeFormat('id-ID', {
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(date));
	}

	const eventTypeConfig: Record<string, { label: string; variant: string }> = {
		kajian: { label: 'Kajian', variant: 'primary' },
		ibadah: { label: 'Ibadah', variant: 'success' },
		sosial: { label: 'Sosial', variant: 'warning' },
		phbi: { label: 'PHBI', variant: 'accent' },
		rapat: { label: 'Rapat', variant: 'neutral' },
		lainnya: { label: 'Lainnya', variant: 'neutral' }
	};

	function getBadgeVariant(type: string) {
		return eventTypeConfig[type]?.variant || 'neutral';
	}

	function getBadgeLabel(type: string) {
		return eventTypeConfig[type]?.label || type;
	}

	function prevMonth() {
		currentDate = new Date(currentYear, currentMonth - 1, 1);
	}

	function nextMonth() {
		currentDate = new Date(currentYear, currentMonth + 1, 1);
	}

	function handleDateClick(day: number) {
		selectedDate = new Date(currentYear, currentMonth, day);
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		selectedDate = null;
	}

	let dateEvents = $derived(selectedDate ? getEventsForDisplay(selectedDate) : []);
</script>

<svelte:head>
	<title>Kegiatan Masjid | TadBeer</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 pb-24 md:pb-8">
	<!-- Header -->
	<div class="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div>
			<h1 class="text-3xl font-bold text-primary">Jadwal Kegiatan</h1>
			<p class="text-base-content/70 mt-1">Ikuti berbagai kegiatan bermanfaat di masjid kami</p>
		</div>

		<div class="flex items-center gap-2 bg-base-200 p-1 rounded-lg self-start md:self-auto">
			<button
				class="btn btn-sm btn-ghost gap-2 {viewMode === 'list' ? 'bg-base-100 shadow-sm' : ''}"
				onclick={() => (viewMode = 'list')}
			>
				<List class="w-4 h-4" />
				List
			</button>
			<button
				class="btn btn-sm btn-ghost gap-2 {viewMode === 'calendar' ? 'bg-base-100 shadow-sm' : ''}"
				onclick={() => (viewMode = 'calendar')}
			>
				<Grid class="w-4 h-4" />
				Kalender
			</button>
		</div>
	</div>

	{#if viewMode === 'list'}
		<!-- List View -->
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#if events.length === 0}
				<div class="col-span-full text-center py-12 text-base-content/50">
					<p class="text-4xl mb-2">📭</p>
					<p>Belum ada kegiatan terjadwal.</p>
				</div>
			{:else}
				{#each events as event}
					<div
						class="card bg-base-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border border-base-200 overflow-hidden group"
					>
						<figure class="relative h-48 overflow-hidden bg-base-300">
							{#if event.imageUrl}
								<img
									src={event.imageUrl}
									alt={event.title}
									class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
								/>
							{:else}
								<div class="flex items-center justify-center w-full h-full text-base-content/20">
									<CalendarIcon class="w-12 h-12" />
								</div>
							{/if}
							<div class="absolute top-3 right-3">
								<div class="badge w-full badge-{eventTypeConfig[event.type]?.variant || 'neutral'}">{event.type}</div>
							</div>
						</figure>
						<div class="card-body p-5">
							<div class="flex items-center gap-2 text-sm text-base-content/60 mb-2">
								<CalendarIcon class="w-4 h-4" />
								<span>{formatDate(event.startTime)}</span>
							</div>
							<h3 class="card-title text-lg font-bold mb-2 line-clamp-2">
								{event.title}
							</h3>
							<div class="space-y-2 text-sm text-base-content/70 mb-4">
								<div class="flex items-center gap-2">
									<Clock class="w-4 h-4 text-primary" />
									<span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
								</div>
								{#if event.location}
									<div class="flex items-center gap-2">
										<MapPin class="w-4 h-4 text-primary" />
										<span>{event.location}</span>
									</div>
								{/if}
								{#if event.speaker}
									<div class="flex items-center gap-2">
										<Users class="w-4 h-4 text-primary" />
										<span>{event.speaker}</span>
									</div>
								{/if}
							</div>

							<div class="card-actions justify-end mt-auto">
								<button
									onclick={() => goto(`/events/${event.id}`)}
									class="btn btn-primary btn-sm btn-outline w-full"
								>
									Lihat Detail
								</button>
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	{:else}
		<!-- Calendar View -->
		<div class="card bg-base-100 border border-base-200 shadow-sm">
			<div class="card-body">
				<div class="flex items-center justify-between mb-6">
					<button class="btn btn-ghost btn-circle btn-sm" onclick={prevMonth}>
						<ChevronLeft class="w-5 h-5" />
					</button>
					<h2 class="text-xl font-bold">
						{monthNames[currentMonth]}
						{currentYear}
					</h2>
					<button class="btn btn-ghost btn-circle btn-sm" onclick={nextMonth}>
						<ChevronRight class="w-5 h-5" />
					</button>
				</div>

				<div class="grid grid-cols-7 gap-2 text-center mb-2">
					{#each ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'] as day}
						<div class="text-sm font-semibold text-base-content/50 py-2">{day}</div>
					{/each}
				</div>

				<div class="grid grid-cols-7 gap-2">
					{#each calendarDays as day}
						{@const dayEvents = day ? getEventsForDay(day) : []}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="aspect-square rounded-lg border border-base-200 p-1 relative transition-colors flex flex-col gap-1 {day
								? 'hover:bg-base-200/50 cursor-pointer'
								: ''}"
							onclick={() => day && handleDateClick(day)}
						>
							{#if day}
								<span
									class="text-xs w-5 h-5 rounded-full flex items-center justify-center self-end {dayEvents.length >
									0
										? `bg-${eventTypeConfig[dayEvents[0].type]?.variant || 'neutral'} text-white font-bold`
										: 'text-base-content/70'}"
								>
									{day}
								</span>
								{#if dayEvents.length > 0}
									<div class="flex flex-col gap-0.5 overflow-hidden">
										{#each dayEvents.slice(0, 2) as event}
											<div class="badge w-full badge-{eventTypeConfig[event.type]?.variant || 'neutral'}">{event.type}</div>
										{/each}
										{#if dayEvents.length > 2}
											<span class="text-[10px] px-1 text-base-content/60"
												>+{dayEvents.length - 2} lainnya</span
											>
										{/if}
									</div>
								{/if}
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Date Click Modal -->
{#if showModal && selectedDate}
	<dialog class="modal modal-open">
		<div class="modal-box max-w-2xl">
			<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onclick={closeModal}
				>✕</button
			>
			<h3 class="font-bold text-lg mb-4">Kegiatan Tanggal {formatDate(selectedDate)}</h3>

			{#if dateEvents.length === 0}
				<div class="py-8 text-center text-base-content/60">
					<p>Tidak ada kegiatan pada tanggal ini.</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each dateEvents as event}
						<div class="card bg-base-200 shadow-sm border border-base-300">
							<div class="card-body p-4">
								<div class="flex justify-between items-start">
									<h4 class="card-title text-base">{event.title}</h4>
									<div class="badge w-full badge-{eventTypeConfig[event.type]?.variant || 'neutral'}">{event.type}</div>
								</div>
								<div class="text-sm space-y-1 mt-2">
									<div class="flex items-center gap-2">
										<Clock class="w-4 h-4 opacity-70" />
										<span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
									</div>
									{#if event.location}
										<div class="flex items-center gap-2">
											<MapPin class="w-4 h-4 opacity-70" />
											<span>{event.location}</span>
										</div>
									{/if}
									{#if event.speaker}
										<div class="flex items-center gap-2">
											<Users class="w-4 h-4 opacity-70" />
											<span>{event.speaker}</span>
										</div>
									{/if}
									{#if event.description}
										<p class="pt-2 text-base-content/80 text-sm">{event.description}</p>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<div class="modal-action">
				<button class="btn" onclick={closeModal}>Tutup</button>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button onclick={closeModal}>close</button>
		</form>
	</dialog>
{/if}
