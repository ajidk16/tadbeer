<script lang="ts">
	import { enhance } from '$app/forms';
	import { Mail, CheckCircle, AlertCircle, Send } from 'lucide-svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let loading = $state(false);
</script>

<svelte:head>
	<title>Verifikasi Email - TadBeer</title>
</svelte:head>

<div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
	<div class="card w-full max-w-md bg-base-100 shadow-xl">
		<div class="card-body items-center text-center">
			<div class="mb-4 bg-primary/10 p-4 rounded-full">
				<Mail class="w-12 h-12 text-primary" />
			</div>

			<h2 class="card-title text-2xl font-bold mb-2">Verifikasi Email Anda</h2>

			<p class="text-base-content/70 mb-6">
				Kami telah mengirimkan tautan verifikasi ke alamat email Anda: <br />
				<span class="font-semibold text-base-content">{data.user?.username}</span>
			</p>

			<p class="text-sm text-base-content/60 mb-8">
				Silakan periksa kotak masuk (atau folder spam) Anda dan klik tautan untuk mengaktifkan akun.
			</p>

			{#if form?.message}
				<div
					role="alert"
					class="alert {form.success ? 'alert-success' : 'alert-error'} mb-6 text-start"
				>
					{#if form.success}
						<CheckCircle class="w-5 h-5" />
					{:else}
						<AlertCircle class="w-5 h-5" />
					{/if}
					<span>{form.message}</span>
				</div>
			{/if}

			<div class="card-actions w-full">
				<form
					method="POST"
					use:enhance={() => {
						loading = true;
						return async ({ update }) => {
							await update();
							loading = false;
						};
					}}
					class="w-full"
				>
					<button class="btn btn-primary w-full" disabled={loading}>
						{#if loading}
							<span class="loading loading-spinner"></span>
							Mengirim...
						{:else}
							<Send class="w-4 h-4 mr-2" />
							Kirim Ulang Email Verifikasi
						{/if}
					</button>
				</form>
			</div>

			<div class="mt-6">
				<a href="/auth/login" class="link link-hover text-sm">Kembali ke Login</a>
			</div>
		</div>
	</div>
</div>
