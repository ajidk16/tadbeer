<script lang="ts">
	interface Props {
		title: string;
		value: string | number;
		description?: string;
		icon?: string;
		trend?: 'up' | 'down' | 'neutral';
		trendValue?: string;
		class?: string;
	}

	let {
		title,
		value,
		description,
		icon,
		trend,
		trendValue,
		class: className = ''
	}: Props = $props();

	const trendClass = {
		up: 'text-success',
		down: 'text-error',
		neutral: 'text-base-content/60'
	};

	const trendIcon = {
		up: '↑',
		down: '↓',
		neutral: '→'
	};
</script>

<div class="stat bg-base-100 rounded-box shadow-sm {className}">
	{#if icon}
		<div class="stat-figure text-primary text-3xl">{icon}</div>
	{/if}

	<div class="stat-title">{title}</div>
	<div class="stat-value text-primary">{value}</div>

	{#if description || (trend && trendValue)}
		<div class="stat-desc {trend ? trendClass[trend] : ''}">
			{#if trend && trendValue}
				<span>{trendIcon[trend]} {trendValue}</span>
			{/if}
			{#if description}
				<span>{description}</span>
			{/if}
		</div>
	{/if}
</div>
