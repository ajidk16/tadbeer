import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { donationCampaign, donation, donationComment } from '$lib/server/db/schema';
import { desc, eq, and } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { quickDonationSchema, donationCommentSchema } from '$lib/schemas';
import { fail, error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const campaignId = parseInt(params.id);

	if (isNaN(campaignId)) {
		error(404, 'Campaign tidak ditemukan');
	}

	// Fetch campaign
	const campaignData = await db.query.donationCampaign.findFirst({
		where: eq(donationCampaign.id, campaignId)
	});

	if (!campaignData) {
		error(404, 'Campaign tidak ditemukan');
	}

	// Fetch donations for this campaign
	const donations = await db
		.select()
		.from(donation)
		.where(eq(donation.campaignId, campaignId))
		.orderBy(desc(donation.createdAt));

	// Fetch comments
	const comments = await db
		.select()
		.from(donationComment)
		.where(eq(donationComment.campaignId, campaignId))
		.orderBy(desc(donationComment.createdAt));

	// Calculate stats
	const verifiedDonations = donations.filter((d) => d.status === 'verified');
	const collected = verifiedDonations.reduce((sum, d) => sum + Number(d.amount), 0);
	const donors = new Set(verifiedDonations.map((d) => d.donorName || d.donorPhone)).size;

	// Calculate deadline
	let deadline = 'Berlangsung';
	let daysLeft: number | null = null;
	if (campaignData.endDate) {
		const endDate = new Date(campaignData.endDate);
		const now = new Date();
		const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
		daysLeft = diffDays;
		if (diffDays > 0) {
			deadline = `${diffDays} Hari lagi`;
		} else if (diffDays === 0) {
			deadline = 'Hari terakhir';
		} else {
			deadline = 'Selesai';
		}
	}

	// Recent donors (limited)
	const recentDonors = verifiedDonations.slice(0, 10).map((d) => ({
		id: d.id,
		name: d.donorName || 'Hamba Allah',
		amount: Number(d.amount),
		createdAt: d.createdAt
	}));

	const campaign = {
		id: campaignData.id,
		title: campaignData.title,
		description: campaignData.description,
		target: Number(campaignData.targetAmount || 0),
		collected,
		donors,
		image:
			campaignData.imageUrl ||
			'https://images.unsplash.com/photo-1605634288488-66c3c4424753?w=800&auto=format&fit=crop&q=60',
		deadline,
		daysLeft,
		startDate: campaignData.startDate,
		endDate: campaignData.endDate,
		active: campaignData.active
	};

	const donationForm = await superValidate(valibot(quickDonationSchema));
	const commentForm = await superValidate(valibot(donationCommentSchema));

	return {
		campaign,
		recentDonors,
		comments: comments.map((c) => ({
			id: c.id,
			name: c.name,
			message: c.message,
			amount: c.amount ? Number(c.amount) : null,
			createdAt: c.createdAt
		})),
		donationForm,
		commentForm
	};
};

export const actions: Actions = {
	donate: async ({ request, params }) => {
		const form = await superValidate(request, valibot(quickDonationSchema));

		if (!form.valid) {
			return fail(400, { donationForm: form });
		}

		const campaignId = parseInt(params.id);

		try {
			await db.insert(donation).values({
				campaignId,
				donorName: form.data.donorName || 'Hamba Allah',
				donorPhone: form.data.donorPhone || null,
				amount: form.data.amount.toString(),
				paymentMethod: form.data.paymentMethod,
				status: 'pending'
			});

			return { donationForm: form, success: true };
		} catch (err) {
			console.error('Donation error:', err);
			return fail(500, { donationForm: form, message: 'Gagal menyimpan donasi' });
		}
	},

	comment: async ({ request, params }) => {
		const form = await superValidate(request, valibot(donationCommentSchema));

		if (!form.valid) {
			return fail(400, { commentForm: form });
		}

		const campaignId = parseInt(params.id);

		try {
			await db.insert(donationComment).values({
				campaignId,
				name: form.data.name,
				message: form.data.message
			});

			return { commentForm: form, commentSuccess: true };
		} catch (err) {
			console.error('Comment error:', err);
			return fail(500, { commentForm: form, message: 'Gagal menyimpan komentar' });
		}
	}
};
