<script lang="ts">
	import { Bell, Check, X } from 'lucide-svelte';

	interface Notification {
		id: string;
		title: string;
		message: string;
		type: 'info' | 'success' | 'warning' | 'error';
		isRead: boolean;
		createdAt: Date;
	}

	interface Props {
		notifications?: Notification[];
		onMarkAsRead?: (id: string) => void;
		onMarkAllAsRead?: () => void;
		onDismiss?: (id: string) => void;
	}

	let { notifications = [], onMarkAsRead, onMarkAllAsRead, onDismiss }: Props = $props();

	let isOpen = $state(false);

	const unreadCount = $derived(notifications.filter((n) => !n.isRead).length);

	const typeStyles = {
		info: 'border-l-info',
		success: 'border-l-success',
		warning: 'border-l-warning',
		error: 'border-l-error'
	};

	const typeIcons = {
		info: '📢',
		success: '✅',
		warning: '⚠️',
		error: '❌'
	};

	function formatTime(date: Date): string {
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (minutes < 1) return 'Baru saja';
		if (minutes < 60) return `${minutes} menit lalu`;
		if (hours < 24) return `${hours} jam lalu`;
		return `${days} hari lalu`;
	}

	function handleMarkAsRead(id: string) {
		onMarkAsRead?.(id);
	}

	function handleDismiss(id: string) {
		onDismiss?.(id);
	}

	function handleMarkAllAsRead() {
		onMarkAllAsRead?.();
	}
</script>

<div class="dropdown dropdown-end">
	<button
		type="button"
		class="btn btn-ghost btn-circle"
		onclick={() => (isOpen = !isOpen)}
		aria-label="Notifikasi"
		aria-haspopup="true"
		aria-expanded={isOpen}
	>
		<div class="indicator">
			<Bell class="w-5 h-5" />
			{#if unreadCount > 0}
				<span class="indicator-item badge badge-primary badge-xs"
					>{unreadCount > 9 ? '9+' : unreadCount}</span
				>
			{/if}
		</div>
	</button>

	{#if isOpen}
		<div
			class="dropdown-content mt-2 w-80 max-h-96 overflow-y-auto bg-base-100 rounded-box shadow-xl border border-base-300 z-50"
			role="menu"
		>
			<!-- Header -->
			<div
				class="flex items-center justify-between p-3 border-b border-base-300 sticky top-0 bg-base-100"
			>
				<h3 class="font-semibold">Notifikasi</h3>
				{#if unreadCount > 0}
					<button type="button" class="btn btn-ghost btn-xs" onclick={handleMarkAllAsRead}>
						<Check class="w-4 h-4" />
						Tandai semua
					</button>
				{/if}
			</div>

			<!-- Notification List -->
			{#if notifications.length === 0}
				<div class="p-6 text-center text-base-content/60">
					<Bell class="w-12 h-12 mx-auto mb-2 opacity-30" />
					<p>Tidak ada notifikasi</p>
				</div>
			{:else}
				<ul class="divide-y divide-base-200">
					{#each notifications as notification (notification.id)}
						<li
							class="p-3 hover:bg-base-200/50 transition-colors border-l-4 {typeStyles[
								notification.type
							]} {notification.isRead ? 'opacity-60' : ''}"
							role="menuitem"
						>
							<div class="flex gap-3">
								<span class="text-lg shrink-0">{typeIcons[notification.type]}</span>
								<div class="flex-1 min-w-0">
									<div class="flex items-start justify-between gap-2">
										<p class="font-medium text-sm truncate">{notification.title}</p>
										<button
											type="button"
											class="btn btn-ghost btn-xs btn-circle opacity-0 group-hover:opacity-100"
											onclick={() => handleDismiss(notification.id)}
											aria-label="Hapus notifikasi"
										>
											<X class="w-3 h-3" />
										</button>
									</div>
									<p class="text-xs text-base-content/70 line-clamp-2">{notification.message}</p>
									<div class="flex items-center justify-between mt-1">
										<span class="text-xs text-base-content/50"
											>{formatTime(notification.createdAt)}</span
										>
										{#if !notification.isRead}
											<button
												type="button"
												class="text-xs text-primary hover:underline"
												onclick={() => handleMarkAsRead(notification.id)}
											>
												Tandai dibaca
											</button>
										{/if}
									</div>
								</div>
							</div>
						</li>
					{/each}
				</ul>
			{/if}

			<!-- Footer -->
			<div class="p-2 border-t border-base-300 sticky bottom-0 bg-base-100">
				<a href="/notifications" class="btn btn-ghost btn-sm btn-block"> Lihat semua notifikasi </a>
			</div>
		</div>
	{/if}
</div>

<!-- Click outside to close -->
{#if isOpen}
	<button
		type="button"
		class="fixed inset-0 z-40 bg-transparent cursor-default"
		onclick={() => (isOpen = false)}
		aria-label="Tutup notifikasi"
	></button>
{/if}
