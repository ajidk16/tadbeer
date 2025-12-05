<script lang="ts">
	import { onMount, type Snippet } from 'svelte';

	interface Props {
		open?: boolean;
		title?: string;
		message?: string;
		confirmText?: string;
		cancelText?: string;
		confirmClass?: string;
		onconfirm?: () => void;
		oncancel?: () => void;
		children?: Snippet;
	}

	let {
		open = $bindable(false),
		title = 'Konfirmasi',
		message = 'Apakah Anda yakin?',
		confirmText = 'Ya',
		cancelText = 'Batal',
		confirmClass = 'btn-primary',
		onconfirm,
		oncancel,
		children
	}: Props = $props();

	let dialogEl: HTMLDialogElement;

	onMount(() => {
		if (open) {
			dialogEl?.showModal();
		} else {
			dialogEl?.close();
		}
	});

	function handleConfirm() {
		onconfirm?.();
		open = false;
	}

	function handleCancel() {
		oncancel?.();
		open = false;
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === dialogEl) {
			handleCancel();
		}
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<dialog
	bind:this={dialogEl}
	class="modal modal-bottom sm:modal-middle"
	onclick={handleBackdropClick}
>
	<div class="modal-box">
		<h3 class="font-bold text-lg">{title}</h3>

		{#if children}
			<div class="py-4">
				{@render children()}
			</div>
		{:else}
			<p class="py-4">{message}</p>
		{/if}

		<div class="modal-action">
			<button class="btn btn-ghost" onclick={handleCancel}>
				{cancelText}
			</button>
			<button class="btn {confirmClass}" onclick={handleConfirm}>
				{confirmText}
			</button>
		</div>
	</div>
</dialog>
