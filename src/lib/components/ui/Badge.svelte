<script lang="ts">
	import type { Snippet } from 'svelte';

	type BadgeVariant =
		| 'neutral'
		| 'primary'
		| 'secondary'
		| 'accent'
		| 'info'
		| 'success'
		| 'warning'
		| 'error'
		| 'ghost';
	type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

	interface Props {
		variant?: BadgeVariant;
		size?: BadgeSize;
		outline?: boolean;
		class?: string;
		children: Snippet;
	}

	let {
		variant = 'neutral',
		size = 'md',
		outline = false,
		class: className = '',
		children
	}: Props = $props();

	const variantClass: Record<BadgeVariant, string> = {
		neutral: 'badge-neutral',
		primary: 'badge-primary',
		secondary: 'badge-secondary',
		accent: 'badge-accent',
		info: 'badge-info',
		success: 'badge-success',
		warning: 'badge-warning',
		error: 'badge-error',
		ghost: 'badge-ghost'
	};

	const sizeClass: Record<BadgeSize, string> = {
		xs: 'badge-xs',
		sm: 'badge-sm',
		md: '',
		lg: 'badge-lg'
	};
</script>

<span
	class="badge {variantClass[variant]} {sizeClass[size]} {outline
		? 'badge-outline'
		: ''} {className}"
>
	{@render children()}
</span>
