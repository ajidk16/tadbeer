import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ request }) => {
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

		// TODO: Save to database
		console.log('Creating member:', {
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
	}
};
