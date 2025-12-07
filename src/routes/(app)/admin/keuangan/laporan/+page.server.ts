import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { financialTransaction } from '$lib/server/db/schema';
import { sql, and, gte, lte } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url }) => {
	const currentYear = new Date().getFullYear();
	const selectedYear = Number(url.searchParams.get('year')) || currentYear;

	const startDate = `${selectedYear}-01-01`;
	const endDate = `${selectedYear}-12-31`;

	// Fetch all transactions for the year
	const transactions = await db
		.select()
		.from(financialTransaction)
		.where(and(gte(financialTransaction.date, startDate), lte(financialTransaction.date, endDate)));

	// Aggregate Monthly Data
	// Initialize array with 12 zeros
	const monthlyIncome = Array(12).fill(0);
	const monthlyExpense = Array(12).fill(0);

	// Aggregate Category Data
	const incomeByCategoryMap = new Map<string, number>();
	const expenseByCategoryMap = new Map<string, number>();

	transactions.forEach((tx) => {
		const monthIndex = new Date(tx.date).getMonth(); // 0-11
		const amount = Number(tx.amount);

		if (tx.type === 'income') {
			monthlyIncome[monthIndex] += amount;
			incomeByCategoryMap.set(tx.category, (incomeByCategoryMap.get(tx.category) || 0) + amount);
		} else {
			monthlyExpense[monthIndex] += amount;
			expenseByCategoryMap.set(tx.category, (expenseByCategoryMap.get(tx.category) || 0) + amount);
		}
	});

	return {
		selectedYear,
		monthlyIncome,
		monthlyExpense,
		incomeByCategory: {
			labels: Array.from(incomeByCategoryMap.keys()),
			values: Array.from(incomeByCategoryMap.values())
		},
		expenseByCategory: {
			labels: Array.from(expenseByCategoryMap.keys()),
			values: Array.from(expenseByCategoryMap.values())
		}
	};
};
