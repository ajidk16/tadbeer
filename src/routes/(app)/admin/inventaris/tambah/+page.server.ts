import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();

		const name = formData.get('name') as string;
		const code = formData.get('code') as string;
		const category = formData.get('category') as string;
		const quantity = formData.get('quantity') as string;
		const condition = formData.get('condition') as string;
		const location = formData.get('location') as string;
		const purchaseDate = formData.get('purchaseDate') as string;
		const price = formData.get('price') as string;
		const description = formData.get('description') as string;
		const image = formData.get('image') as File;

		if (!name || !category || !quantity || !condition) {
			return fail(400, { error: 'Nama, kategori, jumlah, dan kondisi wajib diisi' });
		}

		// TODO: Upload image if exists
		if (image && image.size > 0) {
			console.log('Uploading image:', image.name, image.size);
		}

		// TODO: Save to database
		console.log('Creating asset:', {
			name,
			code,
			category,
			quantity,
			condition,
			location,
			purchaseDate,
			price,
			description
		});

		throw redirect(303, '/inventaris');
	}
};
