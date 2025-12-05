import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Mock data - replace with actual database queries
	const stats = {
		balance: 45750000,
		balanceTrend: 'up' as const,
		balanceTrendValue: '+12%',
		totalIncome: 16500000,
		incomeCount: 24,
		totalExpense: 9200000,
		expenseCount: 15,
		trendPercentage: '+12%',
		trendDirection: 'up' as const
	};

	const cashflowData = {
		months: ['Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
		income: [12000000, 15000000, 11000000, 18000000, 14000000, 16500000],
		expense: [8000000, 9000000, 7000000, 10000000, 8500000, 9200000]
	};

	const incomeByCategory = {
		labels: ['Infaq', 'Zakat', 'Sadaqah', 'Wakaf'],
		values: [45, 25, 18, 12]
	};

	const expenseByCategory = {
		labels: ['Operasional', 'Proyek', 'Gaji', 'Lainnya'],
		values: [40, 30, 20, 10]
	};

	const recentTransactions = [
		{
			id: '1',
			date: new Date().toISOString(),
			description: 'Infaq Jumat',
			category: 'Infaq',
			type: 'income' as const,
			amount: 2500000
		},
		{
			id: '2',
			date: new Date(Date.now() - 86400000).toISOString(),
			description: 'Pembayaran Listrik',
			category: 'Operasional',
			type: 'expense' as const,
			amount: 850000
		},
		{
			id: '3',
			date: new Date(Date.now() - 2 * 86400000).toISOString(),
			description: 'Zakat Fitrah',
			category: 'Zakat',
			type: 'income' as const,
			amount: 5000000
		},
		{
			id: '4',
			date: new Date(Date.now() - 3 * 86400000).toISOString(),
			description: 'Pembelian Sajadah',
			category: 'Proyek',
			type: 'expense' as const,
			amount: 1500000
		},
		{
			id: '5',
			date: new Date(Date.now() - 4 * 86400000).toISOString(),
			description: 'Sadaqah Hamba Allah',
			category: 'Sadaqah',
			type: 'income' as const,
			amount: 1000000
		}
	];

	return {
		stats,
		cashflowData,
		incomeByCategory,
		expenseByCategory,
		recentTransactions
	};
};
