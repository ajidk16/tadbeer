import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { donationCampaign, donation } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { deleteCampaignSchema } from '$lib/schemas';
import { deleteImage, getPublicIdFromUrl } from '$lib/server/cloudinary';

export const load: PageServerLoad = async () => {
	// Fetch campaigns
	const campaignsRaw = await db
		.select()
		.from(donationCampaign)
		.orderBy(desc(donationCampaign.createdAt));

	// Fetch transactions
	const transactionsRaw = await db
		.select()
		.from(donation)
		.orderBy(desc(donation.createdAt))
		.limit(50);

	const allDonations = await db.select().from(donation);

	const campaigns = campaignsRaw.map((c) => {
		const campaignDonations = allDonations.filter(
			(d) => d.campaignId === c.id && d.status === 'verified'
		);
		const collected = campaignDonations.reduce((sum, d) => sum + Number(d.amount), 0);
		const donors = new Set(campaignDonations.map((d) => d.donorName)).size;

		let status = c.active ? 'active' : 'completed';
		if (c.endDate && new Date(c.endDate) < new Date()) {
			status = 'completed';
		}

		return {
			id: c.id,
			title: c.title,
			target: Number(c.targetAmount || 0),
			collected,
			deadline: c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : '',
			status,
			donors,
			description: c.description,
			imageUrl: c.imageUrl
		};
	});

	const transactions = transactionsRaw.map((t) => {
		const c = campaignsRaw.find((c) => c.id === t.campaignId);
		return {
			id: t.id.toString(),
			donorName: t.donorName,
			amount: Number(t.amount),
			campaign: c?.title || 'Umum',
			date: t.createdAt.toISOString(),
			paymentMethod: t.paymentMethod,
			status: t.status === 'verified' ? 'success' : t.status
		};
	});

	const totalCollected = transactions.reduce(
		(acc, curr) => acc + (curr.status === 'success' ? curr.amount : 0),
		0
	);
	const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
	const totalDonors = new Set(allDonations.map((d) => d.donorPhone || d.donorName)).size;

	// Use deleteCampaignSchema for the delete form in the list view
	const form = await superValidate(valibot(deleteCampaignSchema));

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
	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id');

		if (!id) return fail(400, { error: 'ID tidak ditemukan' });

		try {
			const existingCampaign = await db.query.donationCampaign.findFirst({
				where: eq(donationCampaign.id, Number(id))
			});

			if (existingCampaign?.imageUrl) {
				const publicId = getPublicIdFromUrl(existingCampaign.imageUrl);
				if (publicId) await deleteImage(publicId);
			}

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
