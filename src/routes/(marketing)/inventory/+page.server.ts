import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { inventoryItem, assetLending } from '$lib/server/db/schema';
import { desc, eq, ne, sql } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { publicBorrowSchema } from '$lib/schemas';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	// Fetch all inventory items with good/maintenance condition (not lost/damaged)
	const items = await db
		.select()
		.from(inventoryItem)
		.where(ne(inventoryItem.condition, 'lost'))
		.orderBy(desc(inventoryItem.createdAt));

	// Calculate available quantity for each item
	// Available = quantity - currently borrowed count
	const borrowedCounts = await db
		.select({
			assetId: assetLending.assetId,
			count: sql<number>`count(*)`
		})
		.from(assetLending)
		.where(eq(assetLending.status, 'borrowed'))
		.groupBy(assetLending.assetId);

	const borrowedMap = new Map(borrowedCounts.map((b) => [b.assetId, Number(b.count)]));

	// Get unique categories
	const categories = [...new Set(items.map((i) => i.category))].sort();

	const assets = items.map((item) => {
		const borrowed = borrowedMap.get(item.id) || 0;
		const available = Math.max(0, item.quantity - borrowed);

		return {
			id: item.id,
			name: item.name,
			category: item.category,
			stock: item.quantity,
			available,
			image:
				item.imageUrl ||
				'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=800&auto=format&fit=crop&q=60',
			condition: item.condition,
			description: item.description
		};
	});

	const form = await superValidate(valibot(publicBorrowSchema));

	return {
		assets,
		categories: ['Semua', ...categories],
		form
	};
};

export const actions: Actions = {
	borrow: async ({ request }) => {
		const form = await superValidate(request, valibot(publicBorrowSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			// Create lending request
			await db.insert(assetLending).values({
				assetId: form.data.assetId,
				borrowerName: form.data.borrowerName,
				borrowerContact: form.data.borrowerContact,
				borrowDate: new Date(form.data.borrowDate),
				returnDate: new Date(form.data.returnDate),
				notes: form.data.notes || null,
				status: 'borrowed'
			});

			return { form, success: true };
		} catch (err) {
			console.error('Borrow request error:', err);
			return fail(500, { form, message: 'Gagal mengajukan peminjaman' });
		}
	}
};
