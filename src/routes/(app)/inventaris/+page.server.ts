import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	// Mock Assets
	const assets = [
		{
			id: '1',
			name: 'Sound System Yamaha',
			code: 'INV-001',
			category: 'Elektronik',
			condition: 'good',
			quantity: 1,
			location: 'Ruang Utama',
			purchaseDate: '2023-01-15',
			price: 15000000,
			image:
				'https://images.unsplash.com/photo-1520166012956-add9ba0835ce?w=800&auto=format&fit=crop&q=60'
		},
		{
			id: '2',
			name: 'Karpet Sajadah Turki',
			code: 'INV-002',
			category: 'Perlengkapan',
			condition: 'good',
			quantity: 20,
			location: 'Ruang Utama',
			purchaseDate: '2022-05-10',
			price: 2500000,
			image:
				'https://images.unsplash.com/photo-1584646098378-0874589d76e7?w=800&auto=format&fit=crop&q=60'
		},
		{
			id: '3',
			name: 'AC Daikin 2PK',
			code: 'INV-003',
			category: 'Elektronik',
			condition: 'maintenance',
			quantity: 4,
			location: 'Ruang Utama',
			purchaseDate: '2021-11-20',
			price: 6000000,
			image: null
		},
		{
			id: '4',
			name: 'Lemari Kitab Jati',
			code: 'INV-004',
			category: 'Furniture',
			condition: 'good',
			quantity: 2,
			location: 'Perpustakaan',
			purchaseDate: '2020-08-15',
			price: 3500000,
			image: null
		},
		{
			id: '5',
			name: 'Proyektor Epson',
			code: 'INV-005',
			category: 'Elektronik',
			condition: 'damaged',
			quantity: 1,
			location: 'Gudang',
			purchaseDate: '2019-03-10',
			price: 5000000,
			image: null
		}
	];

	// Mock Lending
	const lendings = [
		{
			id: '1',
			assetName: 'Proyektor Epson',
			borrower: 'Remaja Masjid',
			date: '2023-12-01',
			returnDate: '2023-12-02',
			status: 'returned'
		},
		{
			id: '2',
			assetName: 'Sound System Portable',
			borrower: 'Panitia Qurban',
			date: '2023-12-05',
			returnDate: '2023-12-06',
			status: 'borrowed'
		}
	];

	// Mock Maintenance
	const maintenance = [
		{
			id: '1',
			assetName: 'AC Daikin 2PK',
			date: '2023-11-20',
			description: 'Cuci AC rutin',
			cost: 150000,
			status: 'completed'
		},
		{
			id: '2',
			assetName: 'Sound System Yamaha',
			date: '2023-12-10',
			description: 'Ganti kabel mic',
			cost: 50000,
			status: 'scheduled'
		}
	];

	const totalAssets = assets.reduce((acc, curr) => acc + curr.quantity, 0);
	const totalValue = assets.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
	const maintenanceCount = assets.filter((a) => a.condition === 'maintenance').length;

	return {
		assets,
		lendings,
		maintenance,
		stats: {
			totalAssets,
			totalValue,
			maintenanceCount
		}
	};
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) return fail(400, { error: 'ID tidak ditemukan' });

		// TODO: Delete from database
		console.log('Deleting asset:', id);

		return { success: true, message: 'Aset berhasil dihapus' };
	}
};
