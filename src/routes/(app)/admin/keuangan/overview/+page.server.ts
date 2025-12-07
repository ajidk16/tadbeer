import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { financialTransaction } from '$lib/server/db/schema';
import { sql, desc, and, gte, lt } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url }) => {
	const period = url.searchParams.get('period') || 'month'; // month, quarter, year

	const now = new Date();
	let startDate = new Date();
	let previousStartDate = new Date();
	let previousEndDate = new Date();

	// 1. Determine Date Ranges
	if (period === 'month') {
		startDate = new Date(now.getFullYear(), now.getMonth(), 1);
		previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
		previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
	} else if (period === 'quarter') {
		startDate.setMonth(now.getMonth() - 2); // Start of 3 months ago (approx)
		startDate.setDate(1);

		previousStartDate = new Date(startDate);
		previousStartDate.setMonth(startDate.getMonth() - 3);
		previousEndDate = new Date(startDate);
		previousEndDate.setDate(0);
	} else if (period === 'year') {
		startDate = new Date(now.getFullYear(), 0, 1);
		previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
		previousEndDate = new Date(now.getFullYear() - 1, 11, 31);
	}

	// 2. Fetch All Transactions (for Global Balance)
	// Ideally balance is calculated from ALL time, not just the period
	const allTransactions = await db.select().from(financialTransaction);
	const balance = allTransactions.reduce(
		(acc, tx) => acc + Number(tx.amount) * (tx.type === 'income' ? 1 : -1),
		0
	);

	// 3. Fetch Transactions for Current Period
	const currentTransactions = await db
		.select()
		.from(financialTransaction)
		.where(gte(financialTransaction.date, startDate.toISOString().split('T')[0]));

	// 4. Fetch Transactions for Previous Period (for Trend)
	const previousTransactions = await db
		.select()
		.from(financialTransaction)
		.where(
			and(
				gte(financialTransaction.date, previousStartDate.toISOString().split('T')[0]),
				lt(financialTransaction.date, startDate.toISOString().split('T')[0])
			)
		);

	// 5. Calculate Stats
	const totalIncome = currentTransactions
		.filter((t) => t.type === 'income')
		.reduce((acc, t) => acc + Number(t.amount), 0);
	const totalExpense = currentTransactions
		.filter((t) => t.type === 'expense')
		.reduce((acc, t) => acc + Number(t.amount), 0);

	const prevIncome = previousTransactions
		.filter((t) => t.type === 'income')
		.reduce((acc, t) => acc + Number(t.amount), 0);
	// const prevExpense = previousTransactions
	// 	.filter((t) => t.type === 'expense')
	// 	.reduce((acc, t) => acc + Number(t.amount), 0);

	// Trend Calculation (Total Income vs Previous Income as a proxy for "Growth")
	// Or Balance Growth? Let's use Balance Growth if period is large, otherwise Net Income Growth
	const currentNet = totalIncome - totalExpense;
	const prevNet =
		prevIncome -
		previousTransactions
			.filter((t) => t.type === 'expense')
			.reduce((acc, t) => acc + Number(t.amount), 0);

	let trendPercentage = 0;
	if (prevNet !== 0) {
		trendPercentage = Math.round(((currentNet - prevNet) / Math.abs(prevNet)) * 100);
	} else if (currentNet > 0) {
		trendPercentage = 100;
	}

	// 6. Cashflow Chart Data (Last 6 Months hardcoded or dynamic based on requirement)
	// Requirement checks "arus kas bulanan, filter 6 bulan, 12 bulan" -> UI has select, backend needs to support it?
	// The UI currently has a select for chart range, but let's just fetch 12 months by default to be safe and let UI slice it, or fetch 12.
	// Let's fetch last 12 months for the chart.
	const chartMonths = 12;
	const chartStartDate = new Date();
	chartStartDate.setMonth(now.getMonth() - chartMonths + 1);
	chartStartDate.setDate(1);

	const chartTransactions = await db
		.select()
		.from(financialTransaction)
		.where(gte(financialTransaction.date, chartStartDate.toISOString().split('T')[0]));

	const monthsLabels = [];
	const incomeSeries = [];
	const expenseSeries = [];

	for (let i = 0; i < chartMonths; i++) {
		const d = new Date(chartStartDate);
		d.setMonth(d.getMonth() + i);
		const monthLabel = d.toLocaleDateString('id-ID', { month: 'short' });
		monthsLabels.push(monthLabel);

		const monthStr = d.toISOString().slice(0, 7); // YYYY-MM

		const monthlyTxs = chartTransactions.filter((t) => t.date.startsWith(monthStr));
		incomeSeries.push(
			monthlyTxs.filter((t) => t.type === 'income').reduce((a, b) => a + Number(b.amount), 0)
		);
		expenseSeries.push(
			monthlyTxs.filter((t) => t.type === 'expense').reduce((a, b) => a + Number(b.amount), 0)
		);
	}

	// 7. Category Charts (Current Period)
	const incomeByCategoryMap = new Map<string, number>();
	const expenseByCategoryMap = new Map<string, number>();

	currentTransactions.forEach((tx) => {
		const amount = Number(tx.amount);
		if (tx.type === 'income') {
			incomeByCategoryMap.set(tx.category, (incomeByCategoryMap.get(tx.category) || 0) + amount);
		} else {
			expenseByCategoryMap.set(tx.category, (expenseByCategoryMap.get(tx.category) || 0) + amount);
		}
	});

	// 8. Recent Transactions
	const recentTransactions = await db
		.select()
		.from(financialTransaction)
		.orderBy(desc(financialTransaction.date), desc(financialTransaction.createdAt)) // secondary sort by created at
		.limit(5);

	return {
		period,
		stats: {
			balance,
			balanceTrend: trendPercentage >= 0 ? 'up' : 'down',
			// Note: Simplification for "Balance Trend". Using Net Income growth as interaction proxy.
			balanceTrendValue: (trendPercentage > 0 ? '+' : '') + trendPercentage + '%',
			trendPercentage: (trendPercentage > 0 ? '+' : '') + trendPercentage + '%', // For the trend card
			trendDirection: trendPercentage >= 0 ? 'up' : 'down',

			totalIncome,
			incomeCount: currentTransactions.filter((t) => t.type === 'income').length,
			totalExpense,
			expenseCount: currentTransactions.filter((t) => t.type === 'expense').length
		},
		cashflowData: {
			months: monthsLabels,
			income: incomeSeries,
			expense: expenseSeries
		},
		incomeByCategory: {
			labels: Array.from(incomeByCategoryMap.keys()),
			values: Array.from(incomeByCategoryMap.values())
		},
		expenseByCategory: {
			labels: Array.from(expenseByCategoryMap.keys()),
			values: Array.from(expenseByCategoryMap.values())
		},
		recentTransactions
	};
};
