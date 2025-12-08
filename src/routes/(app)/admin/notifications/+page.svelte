<script lang="ts">
	import { enhance } from '$app/forms';
	import { Bell, Check, Info, AlertTriangle, CheckCircle, Settings, Trash2 } from 'lucide-svelte';
	import { page } from '$app/state';

	let { data } = $props();

	// Using reactive derived state from page data
	let notifications = $derived(data.notifications);
	let unreadCount = $derived(notifications.filter((n) => !n.read).length);

	function formatDate(date: Date | string) {
		if (!date) return '';
		const d = new Date(date);
		const now = new Date();
		const diffMs = now.getTime() - d.getTime();
		const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

		if (diffHrs < 24) {
			if (diffHrs < 1) return 'Just now';
			return `${diffHrs} hours ago`;
		}
		return d.toLocaleDateString();
	}
</script>

<div class="max-w-3xl mx-auto space-y-6 p-4 md:p-6">
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-2xl font-bold flex items-center gap-2">
				<Bell class="w-6 h-6" />
				Notifications
				{#if unreadCount > 0}
					<span class="badge badge-primary badge-sm align-top">{unreadCount}</span>
				{/if}
			</h1>
			<p class="text-base-content/60">Stay updated with latest activities.</p>
		</div>
		<div class="flex gap-2">
			<form method="POST" action="?/markAllRead" use:enhance>
				<button class="btn btn-ghost btn-sm" disabled={unreadCount === 0}>
					<Check class="w-4 h-4 mr-1" />
					Mark all read
				</button>
			</form>
			<a href="/admin/notifications/settings" class="btn btn-ghost btn-sm btn-square">
				<Settings class="w-5 h-5" />
			</a>
		</div>
	</div>

	<div class="space-y-4">
		{#if notifications.length === 0}
			<div
				class="text-center py-12 text-base-content/50 bg-base-100 rounded-box border border-base-200"
			>
				<Bell class="w-12 h-12 mx-auto mb-3 opacity-20" />
				<p>No notifications yet.</p>
			</div>
		{:else}
			{#each notifications as notification (notification.id)}
				<div
					class="card bg-base-100 shadow-sm border border-base-200 transition-all hover:shadow-md"
					class:bg-base-200={!notification.read}
				>
					<div class="card-body p-4 flex-row gap-4 items-start">
						<div class="mt-1">
							{#if notification.type === 'info'}
								<div class="p-2 bg-info/10 text-info rounded-full"><Info class="w-5 h-5" /></div>
							{:else if notification.type === 'success'}
								<div class="p-2 bg-success/10 text-success rounded-full">
									<CheckCircle class="w-5 h-5" />
								</div>
							{:else if notification.type === 'warning'}
								<div class="p-2 bg-warning/10 text-warning rounded-full">
									<AlertTriangle class="w-5 h-5" />
								</div>
							{:else if notification.type === 'error'}
								<div class="p-2 bg-error/10 text-error rounded-full">
									<AlertTriangle class="w-5 h-5" />
								</div>
							{/if}
						</div>
						<div class="flex-1 min-w-0">
							<div class="flex justify-between items-start">
								<h3
									class="font-semibold {notification.read
										? 'text-base-content/80'
										: 'text-base-content'}"
								>
									{notification.title}
								</h3>
								<span class="text-xs text-base-content/50 whitespace-nowrap ml-2"
									>{formatDate(notification.createdAt)}</span
								>
							</div>
							<p class="text-sm text-base-content/70 mt-1">{notification.message}</p>
						</div>
						<div class="flex flex-col gap-1">
							{#if !notification.read}
								<form method="POST" action="?/markRead" use:enhance>
									<input type="hidden" name="id" value={notification.id} />
									<button class="btn btn-ghost btn-xs btn-circle text-primary" title="Mark as read">
										<div class="w-2 h-2 bg-primary rounded-full"></div>
									</button>
								</form>
							{/if}
							<form method="POST" action="?/delete" use:enhance>
								<input type="hidden" name="id" value={notification.id} />
								<button
									class="btn btn-ghost btn-xs btn-circle text-error opacity-0 group-hover:opacity-100 transition-opacity"
									title="Delete"
								>
									<Trash2 class="w-4 h-4" />
								</button>
							</form>
						</div>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
