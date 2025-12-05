<script lang="ts">
	import type { Snippet, Component } from 'svelte';

	interface Props {
		href: string;
		title: string;
		description?: string;
		icon?: any; // Lucide icon component
		iconEmoji?: string;
		badge?: string | number;
		badgeType?: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';
		class?: string;
	}

	let {
		href,
		title,
		description,
		icon: Icon,
		iconEmoji,
		badge,
		badgeType = 'primary',
		class: className = ''
	}: Props = $props();
</script>

<a {href} class="card bg-base-100 shadow-sm border border-base-200 hover-lift group {className}">
	<div class="card-body p-4">
		<div class="flex items-start gap-3">
			<!-- Icon -->
			<div
				class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors"
			>
				{#if Icon}
					<Icon class="w-6 h-6 text-primary" />
				{:else if iconEmoji}
					<span class="text-2xl">{iconEmoji}</span>
				{/if}
			</div>

			<!-- Content -->
			<div class="flex-1 min-w-0">
				<div class="flex items-center gap-2">
					<h3 class="font-semibold text-sm group-hover:text-primary transition-colors">{title}</h3>
					{#if badge !== undefined}
						<span class="badge badge-{badgeType} badge-sm">{badge}</span>
					{/if}
				</div>
				{#if description}
					<p class="text-xs text-base-content/60 mt-0.5 line-clamp-2">{description}</p>
				{/if}
			</div>

			<!-- Arrow -->
			<svg
				class="w-5 h-5 text-base-content/30 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
		</div>
	</div>
</a>
