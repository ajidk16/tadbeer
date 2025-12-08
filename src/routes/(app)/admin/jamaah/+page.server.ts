import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { member } from '$lib/server/db/schema';
import { count, desc, eq, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Fetch all members for client-side filtering (per current UI design)
	// In production with large data, we should implement server-side pagination/filtering
	const members = await db.select().from(member).orderBy(desc(member.createdAt));

	// Calculate stats efficiently
	// We can do this in SQL or JS. JS is fine for small datasets.
	const totalMembers = members.length;
	const maleCount = members.filter((m) => m.gender === 'male').length;
	const femaleCount = members.filter((m) => m.gender === 'female').length;
	const activeCount = members.filter((m) => m.status === 'active').length;

	return {
		members,
		totalMembers,
		maleCount,
		femaleCount,
		activeCount
	};
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id');

		if (!id) {
			return fail(400, { error: 'ID tidak ditemukan' });
		}

		try {
			await db.delete(member).where(eq(member.id, Number(id)));
			return { success: true };
		} catch (error) {
			console.error('Delete error:', error);
			return fail(500, { error: 'Gagal menghapus data' });
		}
	},
	import: async ({ request }) => {
		// Mock import for now
		return { success: true };
	}
};
