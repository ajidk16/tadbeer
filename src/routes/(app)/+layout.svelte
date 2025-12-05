<script lang="ts">
	import { AppLayout } from '$lib/components/layout';

	let { children, data } = $props();
</script>

<AppLayout user={data.user}>
	{@render children()}
</AppLayout>
