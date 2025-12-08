import type { Actions, PageServerLoad } from './$types';
import { fail, redirect, error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { inventorySchema } from '$lib/schemas';
import { db } from '$lib/server/db';
import { inventoryItem } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { uploadImageFromBuffer } from '$lib/server/cloudinary';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	if (!id) throw error(404, 'Invalid ID');

	const asset = await db.query.inventoryItem.findFirst({
		where: eq(inventoryItem.id, id)
	});

	if (!asset) throw error(404, 'Aset tidak ditemukan');

	const form = await superValidate(valibot(inventorySchema), {
		defaults: {
			name: asset.name,
			code: asset.code,
			category: asset.category,
			quantity: asset.quantity,
			condition: asset.condition,
			location: asset.location || undefined,
			purchaseDate: asset.purchaseDate || undefined,
			price: asset.price ? Number(asset.price) : undefined,
			description: asset.description || undefined
			// Should I pass id? schema has optional id.
		}
	});

	return { form, asset };
};

export const actions: Actions = {
	update: async ({ request, params }) => {
		const formData = await request.formData();
		const form = await superValidate(formData, valibot(inventorySchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const id = Number(params.id);

		// Handle Image Upload
		let imageUrl = undefined;
		const imageFile = formData.get('image') as File;
		if (imageFile && imageFile.size > 0 && imageFile.name !== 'undefined') {
			try {
				const buffer = Buffer.from(await imageFile.arrayBuffer());
				const uploadResult = await uploadImageFromBuffer(buffer, 'tadbeer/inventory');
				if (uploadResult?.secure_url) {
					imageUrl = uploadResult.secure_url;
				}
			} catch (error) {
				console.error('Failed to upload asset image:', error);
			}
		}

		try {
			await db
				.update(inventoryItem)
				.set({
					name: form.data.name,
					code: form.data.code,
					category: form.data.category,
					quantity: form.data.quantity,
					// @ts-ignore
					condition: form.data.condition as any,
					location: form.data.location,
					purchaseDate: form.data.purchaseDate || null,
					price: form.data.price ? String(form.data.price) : null,
					description: form.data.description,
					...(imageUrl ? { imageUrl } : {}) // Only update image if new one uploaded
				})
				.where(eq(inventoryItem.id, id));
		} catch (error) {
			console.error('Error updating asset:', error);
			return fail(500, { form, message: 'Gagal memperbarui aset' });
		}

		throw redirect(303, '/admin/inventaris');
	},

	delete: async ({ params }) => {
		const id = Number(params.id);
		try {
			await db.delete(inventoryItem).where(eq(inventoryItem.id, id));
		} catch (error) {
			console.error('Error deleting asset:', error);
			// Return fail if needed, but for simple delete action usually redirects
			// If referential integrity fails (lending exists), it will throw.
		}
		throw redirect(303, '/admin/inventaris');
	}
};
