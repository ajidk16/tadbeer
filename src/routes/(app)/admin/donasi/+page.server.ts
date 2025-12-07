import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { donationCampaign, donation } from '$lib/server/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { campaignSchema, deleteCampaignSchema } from '$lib/schemas';

export const load: PageServerLoad = async () => {
	// Fetch campaigns
	const campaignsRaw = await db
		.select()
		.from(donationCampaign)
		.orderBy(desc(donationCampaign.createdAt));

	// Fetch transactions
	// In a real app with many transactions, we should paginate. For now limit to 50 recent.
	const transactionsRaw = await db
		.select()
		.from(donation)
		.orderBy(desc(donation.createdAt))
		.limit(50);

	// Calculate stats
	// We can do this with SQL aggregation ideally, but for MVP JS reduction is fine if dataset small.
	// Let's use JS for now to match structure easily.

	// We need to map campaigns to match UI structure (donors count, collected count)
	// Actually `donation_campaign` table doesn't have `collected` or `donors` columns in schema?
	// Let's check schema:
	// export const donationCampaign = pgTable('donation_campaign', { ... targetAmount, startDate, endDate ... })
	// It does NOT have 'collected' column. So we must aggregate from `donation` table.

	// Let's aggregate donations per campaign
	// This is getting complex for a single query.
	// Let's query all donations and aggregate in JS for now (assuming < 1000 donations).
	const allDonations = await db.select().from(donation);

	const campaigns = campaignsRaw.map((c) => {
		const campaignDonations = allDonations.filter(
			(d) => d.campaignId === c.id && d.status === 'verified'
		);
		const collected = campaignDonations.reduce((sum, d) => sum + Number(d.amount), 0);
		const donors = new Set(campaignDonations.map((d) => d.donorName)).size; // Unique donors approximation

		// Determine status based on date or active flag
		let status = c.active ? 'active' : 'completed';
		if (c.endDate && new Date(c.endDate) < new Date()) {
			status = 'completed';
		}

		return {
			id: c.id,
			title: c.title,
			target: Number(c.targetAmount || 0),
			collected,
			deadline: c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : '', // Format for UI
			status,
			donors,
			description: c.description
		};
	});

	const transactions = transactionsRaw.map((t) => {
		// Find campaign name
		const c = campaignsRaw.find((c) => c.id === t.campaignId);
		return {
			id: t.id.toString(),
			donorName: t.donorName,
			amount: Number(t.amount),
			campaign: c?.title || 'Umum',
			date: t.createdAt.toISOString(),
			paymentMethod: t.paymentMethod,
			status: t.status === 'verified' ? 'success' : t.status // UI expects 'success' for green badge
		};
	});

	const totalCollected = transactions.reduce(
		(acc, curr) => acc + (curr.status === 'success' ? curr.amount : 0),
		0
	);
	const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
	const totalDonors = new Set(allDonations.map((d) => d.donorPhone || d.donorName)).size;

	const form = await superValidate(valibot(campaignSchema));

	return {
		campaigns,
		transactions,
		stats: {
			totalCollected,
			activeCampaigns,
			totalDonors
		},
		form
	};
};

export const actions: Actions = {
	createCampaign: async ({ request }) => {
		const form = await superValidate(request, valibot(campaignSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await db.insert(donationCampaign).values({
				title: form.data.title,
				targetAmount: form.data.target.toString(),
				startDate: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD string
				endDate: form.data.deadline ? form.data.deadline : null, // Assuming YYYY-MM-DD string
				description: form.data.description,
				active: true
			});
			return { form };
		} catch (err) {
			console.error(err);
			return fail(500, { form, message: 'Gagal membuat program' });
		}
	},
	updateCampaign: async ({ request }) => {
		const form = await superValidate(request, valibot(campaignSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		if (!form.data.id) {
			return fail(400, { form, message: 'ID tidak ditemukan' });
		}

		try {
			await db
				.update(donationCampaign)
				.set({
					title: form.data.title,
					targetAmount: form.data.target.toString(),
					endDate: form.data.deadline ? form.data.deadline : null,
					description: form.data.description,
					updatedAt: new Date() // updatedAt is timestamp, so Date is correct
				})
				.where(eq(donationCampaign.id, form.data.id));

			return { form };
		} catch (err) {
			console.error(err);
			return fail(500, { form, message: 'Gagal update program' });
		}
	},
	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id');

		if (!id) return fail(400, { error: 'ID tidak ditemukan' });

		try {
			// Check for dependencies?
			// If cascade delete is not set, we might default to soft delete or error.
			// For now, let's try delete.
			await db.delete(donationCampaign).where(eq(donationCampaign.id, parseInt(id.toString())));
			return { 
				form: await superValidate(request, valibot(deleteCampaignSchema))
			 };
		} catch (err) {
			console.error(err);
			return fail(500, { error: 'Gagal menghapus program (mungkin ada transaksi terkait)' });
		}
	}
};
