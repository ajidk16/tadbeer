import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// In a real app, this would fetch from database
	// For now, return mock data for UI development

	const user = locals.user || {
		name: 'Ahmad',
		role: 'admin'
	};

	// Mock stats data
	const stats = {
		balance: 45750000,
		balanceTrend: 'up' as const,
		balanceTrendValue: '+12%',
		eventsThisMonth: 8,
		newEvents: 3,
		totalMembers: 245,
		newMembers: 12,
		donationThisMonth: 8500000,
		donationTrend: 'up' as const,
		donationTrendValue: '+15%',
		totalDonation: 125000000,
		pendingDonations: 3
	};

	// Mock cashflow data (last 6 months)
	const cashflowData = {
		months: ['Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
		income: [12000000, 15000000, 11000000, 18000000, 14000000, 16000000],
		expense: [8000000, 9000000, 7000000, 10000000, 8500000, 9000000]
	};

	// Mock category data
	const categoryData = {
		labels: ['Infaq', 'Zakat', 'Sadaqah', 'Wakaf'],
		values: [45, 25, 18, 12]
	};

	// Mock upcoming events
	const upcomingEvents = [
		{
			id: '1',
			title: 'Pengajian Rutin Ahad',
			date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
			time: '08:00 - 10:00',
			location: 'Aula Masjid'
		},
		{
			id: '2',
			title: 'Rapat DKM Bulanan',
			date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
			time: '19:30 - 21:00',
			location: 'Ruang Rapat'
		},
		{
			id: '3',
			title: 'Kajian Fiqih Muamalah',
			date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
			time: '16:00 - 17:30',
			location: 'Aula Masjid'
		},
		{
			id: '4',
			title: 'Gotong Royong Masjid',
			date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
			time: '07:00 - 11:00',
			location: 'Area Masjid'
		}
	];

	// Mock recent activity
	const recentActivity = [
		{
			id: '1',
			message: 'Donasi baru Rp 500.000 dari Hamba Allah',
			time: '5 menit lalu'
		},
		{
			id: '2',
			message: 'Jamaah baru mendaftar: Budi Santoso',
			time: '1 jam lalu'
		},
		{
			id: '3',
			message: 'Kegiatan "Pengajian Rutin" diperbarui',
			time: '3 jam lalu'
		},
		{
			id: '4',
			message: 'Laporan keuangan November diekspor',
			time: '1 hari lalu'
		},
		{
			id: '5',
			message: 'Inventaris baru ditambahkan: Karpet Sajadah',
			time: '2 hari lalu'
		}
	];

	return {
		user,
		stats,
		cashflowData,
		categoryData,
		upcomingEvents,
		recentActivity
	};
};
