import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const { id } = params;

	// Mock data - replace with database query
	const asset = {
		id,
		name: 'Sound System Yamaha',
		code: 'INV-001',
		category: 'Elektronik',
		condition: 'good',
		quantity: 1,
		location: 'Ruang Utama',
		purchaseDate: '2023-01-15',
		price: 15000000,
		description: 'Sound system utama untuk sholat Jumat dan kajian.',
		image:
			'https://images.unsplash.com/photo-1520166012956-add9ba0835ce?w=800&auto=format&fit=crop&q=60'
	};

	return { asset };
};

export const actions: Actions = {
	update: async ({ request, params }) => {
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

		// TODO: Update in database
		console.log('Updating asset:', {
			id: params.id,
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
	},

	delete: async ({ params }) => {
		// TODO: Delete from database
		console.log('Deleting asset:', params.id);

		throw redirect(303, '/inventaris');
	}
};
