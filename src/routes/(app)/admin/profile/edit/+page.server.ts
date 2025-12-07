import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { profileSchema } from '$lib/schemas';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { logAudit } from '$lib/server/audit';
import { deleteImage, getPublicIdFromUrl, uploadImage, uploadImageFromBuffer } from '$lib/server/cloudinary';

export const load = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/auth/login');

	const user = await db.query.user.findFirst({
		where: eq(table.user.id, locals.user.id)
	});

	if (!user) throw redirect(302, '/auth/login');

	const form = await superValidate(
		{
			fullName: user.fullName || '',
			phone: user.phone || '',
			about: user.about || ''
		},
		valibot(profileSchema)
	);

	return {
		form,
		user
	};
};

export const actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) return fail(401);

		const formData = await request.formData();
		const form = await superValidate(formData, valibot(profileSchema));
		const avatarFile = formData.get('avatar') as File;

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			let avatarUrl = locals.user.avatarUrl;
			console.log('Avatar File:', avatarFile);

			if (avatarFile && avatarFile.size > 0) {
				// Upload to Cloudinary
				const buffer = Buffer.from(await avatarFile.arrayBuffer());
				const uploadResult = await uploadImageFromBuffer(buffer, 'tadbeer/avatar');
				// Delete old image if exists
				if (avatarUrl) {
					const publicId = getPublicIdFromUrl(avatarUrl);
					if (publicId) await deleteImage(publicId);
				}

				avatarUrl = uploadResult.secure_url;
			}

			await db
				.update(table.user)
				.set({
					fullName: form.data.fullName,
					phone: form.data.phone,
					about: form.data.about,
					avatarUrl,
					updatedAt: new Date()
				})
				.where(eq(table.user.id, locals.user.id));

			await logAudit(locals.user.id, 'UPDATE', 'user', locals.user.id, {
				newValues: { ...form.data, avatarUrl }
			});

			return { form, message: 'Profile updated successfully' };
		} catch (error) {
			console.error('Update profile failed:', error);
			return fail(500, { form, message: 'Failed to update profile' });
		}
	}
};
