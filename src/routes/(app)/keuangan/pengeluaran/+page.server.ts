import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Mock data - replace with database queries
	const transactions = [
		{
			id: '1',
			date: new Date().toISOString(),
			description: 'Pembayaran Listrik',
			category: 'Operasional',
			amount: 850000,
			notes: 'PLN bulan November'
		},
		{
			id: '2',
			date: new Date(Date.now() - 86400000).toISOString(),
			description: 'Pembelian Sajadah',
			category: 'Proyek',
			amount: 1500000,
			notes: '20 lembar sajadah'
		},
		{
			id: '3',
			date: new Date(Date.now() - 2 * 86400000).toISOString(),
			description: 'Gaji Marbot',
			category: 'Gaji',
			amount: 2000000,
			notes: 'Bulan November'
		},
		{
			id: '4',
			date: new Date(Date.now() - 3 * 86400000).toISOString(),
			description: 'Pembayaran Air PDAM',
			category: 'Operasional',
			amount: 350000,
			notes: null
		},
		{
			id: '5',
			date: new Date(Date.now() - 4 * 86400000).toISOString(),
			description: 'Pembelian Sound System',
			category: 'Proyek',
			amount: 5000000,
			notes: 'Upgrade speaker masjid'
		}
	];

	const categories = ['Operasional', 'Proyek', 'Gaji', 'Lainnya'];
	const totalExpense = transactions.reduce((sum, tx) => sum + tx.amount, 0);
	const largestExpense = Math.max(...transactions.map((tx) => tx.amount));

	return {
		transactions,
		categories,
		totalExpense,
		largestExpense,
		transactionCount: transactions.length
	};
};
