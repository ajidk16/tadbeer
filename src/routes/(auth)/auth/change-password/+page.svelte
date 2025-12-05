<script lang="ts">
	import { Eye, EyeOff, Lock, CheckCircle, ArrowRight } from 'lucide-svelte';

	let password = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);
	let showConfirm = $state(false);
	let isLoading = $state(false);
	let isSuccess = $state(false);

	let passwordsMatch = $derived(password === confirmPassword && password.length > 0);

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (!passwordsMatch) return;

		isLoading = true;
		setTimeout(() => {
			isLoading = false;
			isSuccess = true;
			// Redirect after success
			setTimeout(() => {
				window.location.href = '/login';
			}, 3000);
		}, 1500);
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-base-200 p-4">
	<div class="card bg-base-100 shadow-xl w-full max-w-md">
		<div class="card-body p-8">
			{#if !isSuccess}
				<div class="text-center mb-6">
					<div
						class="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4"
					>
						<Lock class="w-8 h-8" />
					</div>
					<h1 class="text-2xl font-bold">Set New Password</h1>
					<p class="text-base-content/60 mt-2">
						Your new password must be different from previously used passwords.
					</p>
				</div>

				<form onsubmit={handleSubmit} class="space-y-5">
					<div class="form-control">
						<label class="label" for="password">
							<span class="label-text font-medium">New Password</span>
						</label>
						<div class="relative">
							<input
								type={showPassword ? 'text' : 'password'}
								id="password"
								bind:value={password}
								class="input input-bordered w-full pr-10"
								required
								minlength="8"
								placeholder="At least 8 characters"
							/>
							<button
								type="button"
								class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
								onclick={() => (showPassword = !showPassword)}
							>
								{#if showPassword}
									<EyeOff class="w-5 h-5" />
								{:else}
									<Eye class="w-5 h-5" />
								{/if}
							</button>
						</div>
					</div>

					<div class="form-control">
						<label class="label" for="confirm">
							<span class="label-text font-medium">Confirm Password</span>
						</label>
						<div class="relative">
							<input
								type={showConfirm ? 'text' : 'password'}
								id="confirm"
								bind:value={confirmPassword}
								class="input input-bordered w-full pr-10 {confirmPassword && !passwordsMatch
									? 'input-error'
									: ''}"
								required
								placeholder="Confirm new password"
							/>
							<button
								type="button"
								class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
								onclick={() => (showConfirm = !showConfirm)}
							>
								{#if showConfirm}
									<EyeOff class="w-5 h-5" />
								{:else}
									<Eye class="w-5 h-5" />
								{/if}
							</button>
						</div>
					</div>

					<button
						type="submit"
						class="btn btn-primary w-full mt-2"
						disabled={isLoading || !passwordsMatch}
					>
						{#if isLoading}
							<span class="loading loading-spinner loading-sm"></span>
							Updating...
						{:else}
							Reset Password
						{/if}
					</button>
				</form>
			{:else}
				<div class="text-center animate-fadeIn py-4">
					<div
						class="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6"
					>
						<CheckCircle class="w-10 h-10" />
					</div>
					<h1 class="text-2xl font-bold">Password Reset</h1>
					<p class="text-base-content/60 mt-2 mb-8">
						Your password has been successfully reset. <br />
						Redirecting to login...
					</p>
					<a href="/login" class="btn btn-primary w-full">
						Sign In Now <ArrowRight class="w-4 h-4 ml-2" />
					</a>
				</div>
			{/if}
		</div>
	</div>
</div>
