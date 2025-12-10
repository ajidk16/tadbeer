import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { donationCampaign, donation } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { quickDonationSchema } from '$lib/schemas';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	// Fetch active campaigns
	const campaignsRaw = await db
		.select()
		.from(donationCampaign)
		.where(eq(donationCampaign.active, true))
		.orderBy(desc(donationCampaign.createdAt));

	// Fetch all donations for aggregation
	const allDonations = await db.select().from(donation);

	// Map campaigns with calculated stats
	const campaigns = campaignsRaw.map((c) => {
		const campaignDonations = allDonations.filter(
			(d) => d.campaignId === c.id && d.status === 'verified'
		);
		const collected = campaignDonations.reduce((sum, d) => sum + Number(d.amount), 0);
		const donors = new Set(campaignDonations.map((d) => d.donorName || d.donorPhone)).size;

		// Calculate deadline text
		let deadline = 'Berlangsung';
		if (c.endDate) {
			const endDate = new Date(c.endDate);
			const now = new Date();
			const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
			if (diffDays > 0) {
				deadline = `${diffDays} Hari lagi`;
			} else if (diffDays === 0) {
				deadline = 'Hari terakhir';
			} else {
				deadline = 'Selesai';
			}
		}

		return {
			id: c.id,
			title: c.title,
			description: c.description,
			target: Number(c.targetAmount || 0),
			collected,
			image:
				c.imageUrl ||
				'https://images.unsplash.com/photo-1605634288488-66c3c4424753?w=800&auto=format&fit=crop&q=60',
			deadline,
			donors
		};
	});

	const form = await superValidate(valibot(quickDonationSchema));

	return {
		campaigns,
		form
	};
};

export const actions: Actions = {
	donate: async ({ request }) => {
		const form = await superValidate(request, valibot(quickDonationSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await db.insert(donation).values({
				campaignId: form.data.campaignId || null,
				donorName: form.data.donorName || 'Hamba Allah',
				donorPhone: form.data.donorPhone || null,
				amount: form.data.amount.toString(),
				paymentMethod: form.data.paymentMethod,
				status: 'pending'
			});

			return { form, success: true };
		} catch (err) {
			console.error('Donation error:', err);
			return fail(500, { form, message: 'Gagal menyimpan donasi' });
		}
	}
};
