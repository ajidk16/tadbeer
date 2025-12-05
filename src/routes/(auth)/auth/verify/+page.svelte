<script lang="ts">
	import { onMount } from 'svelte';
	import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-svelte';

	let status = $state<'loading' | 'success' | 'error'>('loading');

	onMount(() => {
		// Simulate token verification
		setTimeout(() => {
			// Randomly succeed or fail for demo purposes
			status = Math.random() > 0.3 ? 'success' : 'error';

			if (status === 'success') {
				// Auto redirect after 2 seconds
				setTimeout(() => {
					window.location.href = '/auth/change-password';
				}, 2000);
			}
		}, 2000);
	});
</script>

<div class="min-h-screen flex items-center justify-center bg-base-200 p-4">
	<div class="card bg-base-100 shadow-xl w-full max-w-md text-center">
		<div class="card-body p-8 items-center">
			{#if status === 'loading'}
				<div class="w-16 h-16 flex items-center justify-center mb-4">
					<Loader2 class="w-10 h-10 text-primary animate-spin" />
				</div>
				<h2 class="text-xl font-bold">Verifying Token...</h2>
				<p class="text-base-content/60 mt-2">Please wait while we verify your link.</p>
			{:else if status === 'success'}
				<div
					class="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mb-4 animate-bounce-gentle"
				>
					<CheckCircle class="w-8 h-8" />
				</div>
				<h2 class="text-xl font-bold">Email Verified!</h2>
				<p class="text-base-content/60 mt-2">Redirecting you to reset your password...</p>
				<div class="mt-6">
					<a href="/auth/change-password" class="btn btn-primary btn-sm">
						Continue <ArrowRight class="w-4 h-4 ml-1" />
					</a>
				</div>
			{:else}
				<div
					class="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mb-4"
				>
					<XCircle class="w-8 h-8" />
				</div>
				<h2 class="text-xl font-bold">Invalid or Expired Link</h2>
				<p class="text-base-content/60 mt-2">This password reset link is invalid or has expired.</p>
				<div class="mt-6">
					<a href="/forgot-password" class="btn btn-outline"> Resend Link </a>
				</div>
			{/if}
		</div>
	</div>
</div>
