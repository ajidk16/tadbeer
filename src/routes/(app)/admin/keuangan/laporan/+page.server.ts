import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const year = Number(url.searchParams.get('year')) || new Date().getFullYear();

	// Mock data - replace with actual database queries
	const monthlyIncome = [
		12000000, 15000000, 11000000, 18000000, 14000000, 16000000, 12500000, 17000000, 13000000,
		15500000, 14000000, 16500000
	];

	const monthlyExpense = [
		8000000, 9000000, 7000000, 10000000, 8500000, 9000000, 7500000, 9500000, 8000000, 9200000,
		8800000, 9700000
	];

	const incomeByCategory = {
		labels: ['Infaq', 'Zakat', 'Sadaqah', 'Wakaf'],
		values: [45, 25, 18, 12]
	};

	const expenseByCategory = {
		labels: ['Operasional', 'Proyek', 'Gaji', 'Lainnya'],
		values: [40, 30, 20, 10]
	};

	return {
		year,
		monthlyIncome,
		monthlyExpense,
		incomeByCategory,
		expenseByCategory
	};
};
