import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { financialTransaction } from '$lib/server/db/schema';
import { sql, and, gte, lte, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	const { bulan } = params; // Format: YYYY-MM
	const [yearStr, monthStr] = bulan.split('-');
	const year = Number(yearStr);
	const month = Number(monthStr);

	const startDate = `${bulan}-01`;
	// Calculate end date (last day of month)
	const nextMonth = month === 12 ? 1 : month + 1;
	const nextYear = month === 12 ? year + 1 : year;
	const endDateDate = new Date(nextYear, nextMonth - 1, 0); // Day 0 is last day of prev month
	const endDate = endDateDate.toISOString().split('T')[0];

	// Fetch transactions for the month
	const transactions = await db
		.select()
		.from(financialTransaction)
		.where(and(gte(financialTransaction.date, startDate), lte(financialTransaction.date, endDate)))
		.orderBy(desc(financialTransaction.date));

	// Daily Trends Calculation
	const dailyIncomeMap = new Map<number, number>();
	const dailyExpenseMap = new Map<number, number>();
	const daysInMonth = endDateDate.getDate();

	// Initialize maps
	for (let i = 1; i <= daysInMonth; i++) {
		dailyIncomeMap.set(i, 0);
		dailyExpenseMap.set(i, 0);
	}

	// Category Calculation
	const incomeCategoryMap = new Map<string, number>();
	const expenseCategoryMap = new Map<string, number>();
	let totalIncome = 0;
	let totalExpense = 0;

	transactions.forEach((tx) => {
		const day = new Date(tx.date).getDate();
		const amount = Number(tx.amount);

		if (tx.type === 'income') {
			dailyIncomeMap.set(day, (dailyIncomeMap.get(day) || 0) + amount);
			incomeCategoryMap.set(tx.category, (incomeCategoryMap.get(tx.category) || 0) + amount);
			totalIncome += amount;
		} else {
			dailyExpenseMap.set(day, (dailyExpenseMap.get(day) || 0) + amount);
			expenseCategoryMap.set(tx.category, (expenseCategoryMap.get(tx.category) || 0) + amount);
			totalExpense += amount;
		}
	});

	// Prepare Chart Data
	const dailyLabels = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));
	const dailyIncome = Array.from({ length: daysInMonth }, (_, i) => dailyIncomeMap.get(i + 1) || 0);
	const dailyExpense = Array.from(
		{ length: daysInMonth },
		(_, i) => dailyExpenseMap.get(i + 1) || 0
	);

	// Prepare Category Data
	const incomeCategories = Array.from(incomeCategoryMap.entries())
		.map(([name, amount]) => ({
			name,
			amount,
			percentage: totalIncome > 0 ? (amount / totalIncome) * 100 : 0
		}))
		.sort((a, b) => b.amount - a.amount);

	const expenseCategories = Array.from(expenseCategoryMap.entries())
		.map(([name, amount]) => ({
			name,
			amount,
			percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0
		}))
		.sort((a, b) => b.amount - a.amount);

	const monthName = new Date(year, month - 1, 1).toLocaleString('id-ID', { month: 'long' });

	return {
		year,
		month,
		monthName,
		transactions,
		dailyLabels,
		dailyIncome,
		dailyExpense,
		incomeCategories,
		expenseCategories
	};
};
