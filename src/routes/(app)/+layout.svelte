<script lang="ts">
	import { AppLayout } from '$lib/components/layout';
	import { Toast } from '$lib/components/ui';

	let { children, data } = $props();
</script>

<AppLayout user={data.user}>
	{@render children()}
</AppLayout>

<Toast />
