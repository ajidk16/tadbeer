import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { inventorySchema } from '$lib/schemas';
import { db } from '$lib/server/db';
import { inventoryItem } from '$lib/server/db/schema';
import { uploadImageFromBuffer } from '$lib/server/cloudinary';

export const load: PageServerLoad = async () => {
	const form = await superValidate(valibot(inventorySchema));
	return { form };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const form = await superValidate(formData, valibot(inventorySchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		let imageUrl = null;
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
				// Continue? Or error? Usually continue but warn user (though hard to warn in redirect).
			}
		}

		try {
			await db.insert(inventoryItem).values({
				name: form.data.name,
				code: form.data.code || `INV-${Date.now().toString().slice(-6)}`,
				category: form.data.category,
				quantity: form.data.quantity,
				// @ts-ignore - condition enum matching
				condition: form.data.condition as any,
				location: form.data.location,
				purchaseDate: form.data.purchaseDate || null,
				price: form.data.price ? String(form.data.price) : null,
				description: form.data.description,
				imageUrl: imageUrl
			});
		} catch (error) {
			console.error('Error creating asset:', error);
			// Check for unique code error
			return fail(500, { form, message: 'Gagal menyimpan aset.' });
		}

		throw redirect(303, '/admin/inventaris');
	}
};
