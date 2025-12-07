<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		Calendar,
		Clock,
		MapPin,
		Users,
		Share2,
		ArrowLeft,
		CheckCircle2,
		AlertCircle
	} from 'lucide-svelte';
	import { Badge, Toast, success as toastSuccess, error as toastError } from '$lib/components/ui';
	import { superForm } from 'sveltekit-superforms';
	import { valibotClient } from 'sveltekit-superforms/adapters';
	import { object, string, minLength, email, optional } from 'valibot';

	let { data } = $props();
	const event = $derived(data.event);
	const otherEvents = $derived(data.otherEvents);

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

	// Schema needs to be same as server for client-side validation if we pass it
	// But for now we rely on server schema via superform return
	// actually we need to reconstruct validation schema if we use validators option in superForm
	const registrationSchema = object({
		name: string([minLength(3, 'Nama harus diisi minimal 3 karakter')]),
		email: optional(string([email('Email tidak valid')])),
		phone: string([minLength(10, 'Nomor WhatsApp tidak valid')]),
		notes: optional(string())
	});

	const {
		form,
		errors,
		constraints,
		enhance: superEnhance,
		delayed,
		message
	} = superForm(data.form, {
		validators: valibotClient(registrationSchema),
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toastSuccess('Pendaftaran berhasil! Sampai jumpa di lokasi.');
				(document.getElementById('registration_modal') as HTMLDialogElement).close();
			} else if (result.type === 'failure') {
				toastError('Gagal mendaftar. Silakan periksa kembali data Anda.');
			}
		}
	});
</script>

<svelte:head>
	<title>{event.title} | TadBeer</title>
	<meta name="description" content={event.description} />
</svelte:head>

<Toast />

<div class="min-h-screen bg-base-100 pb-20">
	<!-- Hero Section -->
	<div class="relative h-[40vh] md:h-[50vh] w-full overflow-hidden bg-base-300">
		{#if event.imageUrl}
			<img src={event.imageUrl} alt={event.title} class="w-full h-full object-cover" />
			<div class="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
		{:else}
			<!-- Pattern Background fallback -->
			<div
				class="absolute inset-0 bg-gradient-to-br from-primary/80 to-secondary/80 flex items-center justify-center"
			>
				<Calendar class="w-32 h-32 text-white/20" />
			</div>
		{/if}

		<div
			class="container mx-auto px-4 h-full flex flex-col justify-end pb-8 md:pb-12 relative z-10"
		>
			<a
				href="/events"
				class="absolute top-4 left-4 btn btn-circle btn-ghost text-white hover:bg-white/20"
			>
				<ArrowLeft class="w-6 h-6" />
			</a>

			<div class="max-w-4xl space-y-4">
				<Badge
					variant={getBadgeVariant(event.type) as any}
					class="mb-2 shadow-lg border-none text-white"
				>
					{getBadgeLabel(event.type)}
				</Badge>
				<h1 class="text-3xl md:text-5xl font-bold text-white leading-tight drop-shadow-md">
					{event.title}
				</h1>
				<div class="flex flex-wrap gap-4 text-white/90 text-sm md:text-base font-medium">
					<div class="flex items-center gap-2">
						<Calendar class="w-5 h-5" />
						<span>{formatDate(event.startTime)}</span>
					</div>
					<div class="flex items-center gap-2">
						<Clock class="w-5 h-5" />
						<span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
					</div>
					{#if event.location}
						<div class="flex items-center gap-2">
							<MapPin class="w-5 h-5" />
							<span>{event.location}</span>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<div class="container mx-auto px-4 -mt-8 relative z-20">
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Main Content -->
			<div class="lg:col-span-2 space-y-8">
				<div class="card bg-base-100 shadow-xl border border-base-200">
					<div class="card-body p-6 md:p-8">
						<div class="prose prose-lg max-w-none">
							<h3 class="flex items-center gap-2 text-xl font-bold mb-4">
								<Users class="w-6 h-6 text-primary" />
								Deskripsi Kegiatan
							</h3>
							<p class="whitespace-pre-line text-base-content/80 leading-relaxed">
								{event.description || 'Tidak ada deskripsi detail untuk kegiatan ini.'}
							</p>

							{#if event.speaker}
								<div class="divider"></div>
								<h3 class="flex items-center gap-2 text-xl font-bold mb-4">
									<Users class="w-6 h-6 text-primary" />
									Pemateri
								</h3>
								<div class="flex items-center gap-4 bg-base-200/50 p-4 rounded-xl">
									<div class="avatar placeholder">
										<div class="bg-neutral text-neutral-content rounded-full w-16">
											<span class="text-2xl">{event.speaker.charAt(0)}</span>
										</div>
									</div>
									<div>
										<p class="font-bold text-lg">{event.speaker}</p>
										<p class="text-sm text-base-content/60">Narasumber</p>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Other Events (Mobile only here, usually bottom) -->
			</div>

			<!-- Sidebar -->
			<div class="lg:col-span-1 space-y-6">
				<!-- Registration Card -->
				<div class="card bg-base-100 shadow-xl border border-base-200 sticky top-24">
					<div class="card-body">
						<!-- <h3 class="card-title text-xl mb-2">Informasi Pendaftaran</h3> -->

						<!-- <div class="flex justify-between items-center py-3 border-b border-base-200">
							<span class="text-base-content/70">Biaya</span>
							<span class="font-bold text-primary text-lg">Gratis</span>
						</div> -->
						{#if event.capacity}
							<div class="flex justify-between items-center py-3 border-b border-base-200">
								<span class="text-base-content/70">Kapasitas</span>
								<span class="font-medium">{event.capacity} Orang</span>
							</div>
						{/if}

						<div class="mt-6 space-y-3">
							{#if event.status === 'scheduled' || event.status === 'ongoing'}
								<button
									class="btn btn-primary w-full shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all font-bold text-lg"
									onclick={() =>
										(
											document.getElementById('registration_modal') as HTMLDialogElement
										).showModal()}
								>
									Daftar Sekarang
								</button>
							{:else}
								<button class="btn btn-disabled w-full"> Pendaftaran Ditutup </button>
							{/if}
							<button class="btn btn-outline btn-ghost w-full gap-2">
								<Share2 class="w-4 h-4" />
								Bagikan
							</button>
						</div>
					</div>
				</div>

				<!-- Other Events -->
				{#if otherEvents.length > 0}
					<div class="space-y-4">
						<h3 class="font-bold text-lg px-1">Kegiatan Lainnya</h3>
						{#each otherEvents as other}
							<a
								href="/events/{other.id}"
								class="card card-side bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-all group"
							>
								<figure class="w-24 relative overflow-hidden">
									{#if other.imageUrl}
										<img
											src={other.imageUrl}
											alt={other.title}
											class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
										/>
									{:else}
										<div class="w-full h-full bg-base-300 flex items-center justify-center">
											<Calendar class="w-8 h-8 opacity-20" />
										</div>
									{/if}
								</figure>
								<div class="card-body p-3 justify-center">
									<h4 class="card-title text-sm line-clamp-2">{other.title}</h4>
									<p class="text-xs text-base-content/60 flex items-center gap-1">
										<Calendar class="w-3 h-3" />
										{formatDate(other.startTime)}
									</p>
								</div>
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Registration Modal -->
<dialog id="registration_modal" class="modal modal-bottom sm:modal-middle">
	<div class="modal-box p-0 overflow-hidden">
		<!-- Header -->
		<div class="bg-primary text-primary-content p-6 relative">
			<button
				class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 text-white/70 hover:text-white"
				onclick={() => (document.getElementById('registration_modal') as HTMLDialogElement).close()}
				>✕</button
			>
			<h3 class="font-bold text-xl">Daftar Kegiatan</h3>
			<p class="text-primary-content/80 text-sm mt-1">{event.title}</p>
		</div>

		<div class="p-6">
			<form method="POST" action="?/register" use:superEnhance class="space-y-4">
				<div class="form-control">
					<label class="label" for="name">
						<span class="label-text font-medium">Nama Lengkap *</span>
					</label>
					<input
						type="text"
						name="name"
						id="name"
						class="input input-bordered w-full focus:input-primary {$errors.name
							? 'input-error'
							: ''}"
						placeholder="Nama sesuai KTP"
						bind:value={$form.name}
						{...$constraints.name}
					/>
					{#if $errors.name}<span class="text-error text-xs mt-1 flex items-center gap-1"
							><AlertCircle class="w-3 h-3" /> {$errors.name}</span
						>{/if}
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="form-control">
						<label class="label" for="phone">
							<span class="label-text font-medium">WhatsApp *</span>
						</label>
						<input
							type="tel"
							name="phone"
							id="phone"
							class="input input-bordered w-full focus:input-primary {$errors.phone
								? 'input-error'
								: ''}"
							placeholder="0812..."
							bind:value={$form.phone}
							{...$constraints.phone}
						/>
						{#if $errors.phone}<span class="text-error text-xs mt-1 flex items-center gap-1"
								><AlertCircle class="w-3 h-3" /> {$errors.phone}</span
							>{/if}
					</div>

					<div class="form-control">
						<label class="label" for="email">
							<span class="label-text font-medium">Email (Opsional)</span>
						</label>
						<input
							type="email"
							name="email"
							id="email"
							class="input input-bordered w-full focus:input-primary {$errors.email
								? 'input-error'
								: ''}"
							placeholder="email@contoh.com"
							bind:value={$form.email}
							{...$constraints.email}
						/>
						{#if $errors.email}<span class="text-error text-xs mt-1 flex items-center gap-1"
								><AlertCircle class="w-3 h-3" /> {$errors.email}</span
							>{/if}
					</div>
				</div>

				<div class="form-control">
					<label class="label" for="notes">
						<span class="label-text font-medium">Catatan (Opsional)</span>
					</label>
					<textarea
						name="notes"
						id="notes"
						class="textarea textarea-bordered w-full focus:textarea-primary"
						placeholder="Pertanyaan atau catatan khusus..."
						rows="3"
						bind:value={$form.notes}
						{...$constraints.notes}
					></textarea>
				</div>

				<div class="modal-action mt-8">
					<button
						type="button"
						class="btn btn-ghost"
						onclick={() =>
							(document.getElementById('registration_modal') as HTMLDialogElement).close()}
						>Batal</button
					>
					<button type="submit" class="btn btn-primary px-8" disabled={$delayed}>
						{#if $delayed}
							<span class="loading loading-spinner"></span>
						{/if}
						Daftar Sekarang
					</button>
				</div>
			</form>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button
			onclick={() => (document.getElementById('registration_modal') as HTMLDialogElement).close()}
			>close</button
		>
	</form>
</dialog>
