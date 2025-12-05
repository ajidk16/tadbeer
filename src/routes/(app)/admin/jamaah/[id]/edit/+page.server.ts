import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const { id } = params;

	// Mock data - replace with database query
	const member = {
		id,
		name: 'Ahmad Sudrajat',
		nik: '3201234567890001',
		gender: 'male',
		birthDate: '1985-03-15',
		phone: '08123456789',
		email: 'ahmad.s@email.com',
		address: 'Jl. Masjid No. 123, RT 01/RW 02',
		status: 'active',
		avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad'
	};

	return { member };
};

export const actions: Actions = {
	update: async ({ request, params }) => {
		const formData = await request.formData();

		const name = formData.get('name') as string;
		const nik = formData.get('nik') as string;
		const gender = formData.get('gender') as string;
		const birthDate = formData.get('birthDate') as string;
		const phone = formData.get('phone') as string;
		const email = formData.get('email') as string;
		const address = formData.get('address') as string;
		const status = formData.get('status') as string;
		const avatar = formData.get('avatar') as File;

		if (!name || !gender) {
			return fail(400, { error: 'Nama dan jenis kelamin wajib diisi' });
		}

		// TODO: Upload avatar if exists
		if (avatar && avatar.size > 0) {
			console.log('Uploading avatar:', avatar.name, avatar.size);
		}

		// TODO: Update in database
		console.log('Updating member:', {
			id: params.id,
			name,
			nik,
			gender,
			birthDate,
			phone,
			email,
			address,
			status
		});

		throw redirect(303, '/jamaah');
	},

	delete: async ({ params }) => {
		// TODO: Delete from database
		console.log('Deleting member:', params.id);

		throw redirect(303, '/jamaah');
	}
};
