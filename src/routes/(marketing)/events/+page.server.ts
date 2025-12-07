import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { event } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const events = await db.select().from(event).orderBy(desc(event.startTime));

	return {
		events: events.map((e) => ({
			...e
			// Ensure dates are passed as strings or Date objects as preferred by SvelteKit serialization (Dates are fine in V2/newer, but usually strings are safer for boundaries if any issues, but standard structured clone handles Dates now).
			// However, the current frontend mock uses `new Date()`. SvelteKit `data` serialization supports Date.
			// But let's verify if I need to do anything specific.
			// The admin page passed strings: `date: e.startTime.toISOString()`.
			// The frontend mock uses `new Date(...)`.
			// I will pass them as Date objects if possible, or strings and convert in frontend.
			// SvelteKit automatically serializes Date objects.

			// Map DB type to frontend type if needed, or just let frontend handle DB types.
			// I'll update frontend to handle DB types.
		}))
	};
};
