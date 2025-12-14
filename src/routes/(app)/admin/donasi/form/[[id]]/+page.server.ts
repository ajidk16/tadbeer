/* eslint-disable @typescript-eslint/no-explicit-any */
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { campaignSchema, deleteCampaignSchema } from '$lib/schemas';
import { db } from '$lib/server/db';
import { donationCampaign } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { deleteImage, getPublicIdFromUrl, uploadImageFromBuffer } from '$lib/server/cloudinary';

export const load: PageServerLoad = async ({ params }) => {
	const { id } = params;

	let form;

	if (id && id !== 'new') {
		const existingCampaign = await db.query.donationCampaign.findFirst({
			where: eq(donationCampaign.id, Number(id))
		});

		if (!existingCampaign) {
			// Handle not found
			form = await superValidate(valibot(campaignSchema));
		} else {
			// Map DB fields to schema fields
			const formData = {
				...existingCampaign,
				target: existingCampaign.targetAmount ? Number(existingCampaign.targetAmount) : 0,
				deadline: existingCampaign.endDate ? existingCampaign.endDate.split('T')[0] : '',
				image: existingCampaign.imageUrl || '',
				description: existingCampaign.description ?? undefined
			};
			form = await superValidate(formData, valibot(campaignSchema));
		}
	} else {
		form = await superValidate(valibot(campaignSchema));
	}

	return {
		form
	};
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const form = await superValidate(formData, valibot(campaignSchema));

		if (!form.valid) {
			delete form.data.image;
			return fail(400, { form });
		}

		try {
			let imageUrl = '';
			const imageFile = formData.get('image');

			if (imageFile && imageFile instanceof File && imageFile.size > 0) {
				const buffer = Buffer.from(await imageFile.arrayBuffer());
				try {
					const uploadResult = await uploadImageFromBuffer(buffer, 'minimasjid/campaigns');
					if (uploadResult && uploadResult.secure_url) {
						imageUrl = uploadResult.secure_url;
					}
				} catch (err) {
					console.error('Image upload failed:', err);
					delete form.data.image;
					return fail(500, {
						form,
						message:
							'Gagal mengunggah gambar. Silakan coba lagi atau gunakan gambar yang lebih kecil.'
					});
				}
			}

			await db.insert(donationCampaign).values({
				title: form.data.title,
				targetAmount: form.data.target.toString(),
				startDate: new Date().toISOString().split('T')[0], // Today
				endDate: form.data.deadline ? form.data.deadline : null,
				description: form.data.description,
				imageUrl: imageUrl || undefined,
				active: true
			});
		} catch (error) {
			console.error(error);
			delete form.data.image;
			return fail(500, { form, message: 'Gagal membuat program donasi' });
		}

		throw redirect(303, '/admin/donasi');
	},

	update: async ({ request }) => {
		const formData = await request.formData();
		const form = await superValidate(formData, valibot(campaignSchema));

		if (!form.valid) {
			delete form.data.image;
			return fail(400, { form });
		}

		if (!form.data.id) {
			delete form.data.image;
			return fail(400, { form, message: 'ID missing for update' });
		}

		try {
			let imageUrl = undefined;

			const existingCampaign = await db.query.donationCampaign.findFirst({
				where: eq(donationCampaign.id, form.data.id)
			});

			if (!existingCampaign) {
				delete form.data.image;
				return fail(404, { form, message: 'Program tidak ditemukan' });
			}

			const imageFile = formData.get('image') as File;

			if (imageFile && imageFile instanceof File && imageFile.size > 0) {
				const buffer = Buffer.from(await imageFile.arrayBuffer());

				try {
					const uploadResult = await uploadImageFromBuffer(buffer, 'minimasjid/campaigns');
					imageUrl = uploadResult.secure_url;

					// Only delete old image after successful upload
					if (existingCampaign.imageUrl) {
						const oldImageId = getPublicIdFromUrl(existingCampaign.imageUrl);
						if (oldImageId) {
							try {
								await deleteImage(oldImageId);
							} catch (deleteErr) {
								console.error('Failed to delete old image:', deleteErr);
							}
						}
					}
				} catch (err) {
					console.error('Image upload failed:', err);
					delete form.data.image;
					return fail(500, {
						form,
						message:
							'Gagal mengunggah gambar. Silakan coba lagi atau gunakan gambar yang lebih kecil.'
					});
				}
			}

			const updatePayload: any = {
				title: form.data.title,
				targetAmount: form.data.target.toString(),
				endDate: form.data.deadline ? form.data.deadline : null,
				description: form.data.description,
				updatedAt: new Date()
			};

			if (imageUrl) {
				updatePayload.imageUrl = imageUrl;
			}

			await db
				.update(donationCampaign)
				.set(updatePayload)
				.where(eq(donationCampaign.id, form.data.id));
		} catch (error) {
			console.error(error);
			delete form.data.image;
			return fail(500, { form, message: 'Gagal memperbarui program' });
		}

		throw redirect(303, '/admin/donasi');
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id');

		if (!id) {
			return fail(400, { message: 'ID required' });
		}

		const existingCampaign = await db.query.donationCampaign.findFirst({
			where: eq(donationCampaign.id, Number(id))
		});

		if (!existingCampaign) {
			return fail(404, { message: 'Program tidak ditemukan' });
		}

		try {
			if (existingCampaign.imageUrl) {
				const publicId = getPublicIdFromUrl(existingCampaign.imageUrl);
				if (publicId) await deleteImage(publicId);
			}
			await db.delete(donationCampaign).where(eq(donationCampaign.id, Number(id)));

			// Return a dummy form object for valibot validation if needed,
			// but here we just redirect or return success.
			// Superforms usually expects a form object if we are using it for delete,
			// but if we used a simple form action without superforms on the client for delete,
			// we can return success.
			// However, in the client I used `formaction="?/delete"` inside the main form.
			// Ideally separate form for delete or handle it.
			// The client code uses:
			// formaction="?/delete" ...

			// If we redirect, we are good.
		} catch (error) {
			console.error(error);
			return fail(500, { message: 'Gagal menghapus program' });
		}

		throw redirect(303, '/admin/donasi');
	}
};
