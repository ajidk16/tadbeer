import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	// Mock data - replace with database queries
	const members = [
		{
			id: '1',
			name: 'Ahmad Sudrajat',
			nik: '3201234567890001',
			gender: 'male',
			birthDate: '1985-03-15',
			phone: '08123456789',
			email: 'ahmad.s@email.com',
			address: 'Jl. Masjid No. 123, RT 01/RW 02',
			status: 'active',
			avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad'
		},
		{
			id: '2',
			name: 'Fatimah Azzahra',
			nik: '3201234567890002',
			gender: 'female',
			birthDate: '1990-07-20',
			phone: '08234567890',
			email: 'fatimah.az@email.com',
			address: 'Jl. Kenanga No. 45',
			status: 'active',
			avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatimah'
		},
		{
			id: '3',
			name: 'Muhammad Rizki',
			nik: '3201234567890003',
			gender: 'male',
			birthDate: '1978-11-08',
			phone: '08345678901',
			email: null,
			address: 'Jl. Melati No. 67',
			status: 'active',
			avatar: null
		},
		{
			id: '4',
			name: 'Siti Nurhaliza',
			nik: '3201234567890004',
			gender: 'female',
			birthDate: '1995-02-14',
			phone: '08456789012',
			email: 'siti.n@email.com',
			address: null,
			status: 'active',
			avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Siti'
		},
		{
			id: '5',
			name: 'Abdullah Rahman',
			nik: null,
			gender: 'male',
			birthDate: '1960-06-25',
			phone: '08567890123',
			email: null,
			address: 'Jl. Dahlia No. 89',
			status: 'inactive',
			avatar: null
		},
		{
			id: '6',
			name: 'Aisyah Putri',
			nik: '3201234567890006',
			gender: 'female',
			birthDate: '2000-12-01',
			phone: '08678901234',
			email: 'aisyah.p@email.com',
			address: 'Jl. Anggrek No. 12',
			status: 'active',
			avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aisyah'
		}
	];

	const maleCount = members.filter((m) => m.gender === 'male').length;
	const femaleCount = members.filter((m) => m.gender === 'female').length;
	const activeCount = members.filter((m) => m.status === 'active').length;

	return {
		members,
		totalMembers: members.length,
		maleCount,
		femaleCount,
		activeCount
	};
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const nik = formData.get('nik') as string;
		const gender = formData.get('gender') as string;
		const birthDate = formData.get('birthDate') as string;
		const phone = formData.get('phone') as string;
		const email = formData.get('email') as string;
		const address = formData.get('address') as string;
		const status = formData.get('status') as string;

		if (!name || !gender) {
			return fail(400, { error: 'Nama dan gender wajib diisi' });
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

		return { success: true, message: 'Jamaah berhasil ditambahkan' };
	},

	update: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const name = formData.get('name') as string;
		const nik = formData.get('nik') as string;
		const gender = formData.get('gender') as string;
		const birthDate = formData.get('birthDate') as string;
		const phone = formData.get('phone') as string;
		const email = formData.get('email') as string;
		const address = formData.get('address') as string;
		const status = formData.get('status') as string;

		if (!id || !name || !gender) {
			return fail(400, { error: 'Data tidak lengkap' });
		}

		// TODO: Update in database
		console.log('Updating member:', {
			id,
			name,
			nik,
			gender,
			birthDate,
			phone,
			email,
			address,
			status
		});

		return { success: true, message: 'Data jamaah berhasil diperbarui' };
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) return fail(400, { error: 'ID tidak ditemukan' });

		// TODO: Delete from database
		console.log('Deleting member:', id);

		return { success: true, message: 'Data jamaah berhasil dihapus' };
	}
};
