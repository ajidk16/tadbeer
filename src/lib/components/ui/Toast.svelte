<script lang="ts" module>
	export type ToastType = 'success' | 'error' | 'warning' | 'info';

	export interface Toast {
		id: string;
		type: ToastType;
		message: string;
		duration?: number;
	}

	// Global toast store
	let toasts = $state<Toast[]>([]);

	export function addToast(type: ToastType, message: string, duration = 5000): string {
		const id = crypto.randomUUID();
		toasts = [...toasts, { id, type, message, duration }];

		if (duration > 0) {
			setTimeout(() => removeToast(id), duration);
		}

		return id;
	}

	export function removeToast(id: string) {
		toasts = toasts.filter((t) => t.id !== id);
	}

	export function success(message: string, duration?: number) {
		return addToast('success', message, duration);
	}

	export function error(message: string, duration?: number) {
		return addToast('error', message, duration);
	}

	export function warning(message: string, duration?: number) {
		return addToast('warning', message, duration);
	}

	export function info(message: string, duration?: number) {
		return addToast('info', message, duration);
	}

	export function getToasts() {
		return toasts;
	}
</script>

<script lang="ts">
	const iconMap: Record<ToastType, string> = {
		success: '✓',
		error: '✗',
		warning: '⚠',
		info: 'ℹ'
	};

	const alertClass: Record<ToastType, string> = {
		success: 'alert-success',
		error: 'alert-error',
		warning: 'alert-warning',
		info: 'alert-info'
	};
</script>

<div class="toast toast-end toast-bottom z-50">
	{#each toasts as toast (toast.id)}
		<div class="alert {alertClass[toast.type]} shadow-lg animate-fadeIn">
			<span class="text-lg">{iconMap[toast.type]}</span>
			<span>{toast.message}</span>
			<button class="btn btn-ghost btn-xs btn-circle" onclick={() => removeToast(toast.id)}>
				✕
			</button>
		</div>
	{/each}
</div>
