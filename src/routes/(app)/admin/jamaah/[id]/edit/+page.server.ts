import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { memberSchema } from '$lib/schemas';
import { db } from '$lib/server/db';
import { member } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { uploadImageFromBuffer, deleteImage, getPublicIdFromUrl } from '$lib/server/cloudinary';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	if (isNaN(id)) throw error(404, 'Jamaah tidak ditemukan');

	const data = await db.query.member.findFirst({
		where: eq(member.id, id)
	});

	if (!data) throw error(404, 'Jamaah tidak ditemukan');

	const form = await superValidate(
		{
			id: data.id,
			name: data.fullName,
			nik: data.nik || '',
			gender: data.gender || 'male',
			birthDate: data.birthDate ? data.birthDate : '',
			phone: data.phone || '',
			email: data.email || '',
			address: data.address || '',
			status: data.status || 'active'
		},
		valibot(memberSchema)
	);

	return { form, member: data };
};

export const actions: Actions = {
	update: async ({ request, params }) => {
		const id = Number(params.id);
		if (isNaN(id)) return fail(400, { message: 'Invalid ID' });

		const formData = await request.formData();
		const form = await superValidate(formData, valibot(memberSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		// Get existing member to check for old avatar
		const existingMember = await db.query.member.findFirst({
			where: eq(member.id, id)
		});

		if (!existingMember) return fail(404, { message: 'Member not found' });

		let imageUrl = existingMember.imageUrl;
		const avatarFile = formData.get('avatar') as File;

		if (avatarFile && avatarFile.size > 0 && avatarFile.name !== 'undefined') {
			try {
				const buffer = Buffer.from(await avatarFile.arrayBuffer());
				const uploadResult = await uploadImageFromBuffer(buffer, 'minimasjid/members');
				if (uploadResult?.secure_url) {
					// Delete old avatar if exists and it's a cloudinary url
					// Note: Check if existingMember.imageUrl exists and is cloudinary before delete?
					// The utility deleteImage handles publicId.
					// I need a way to extract publicId. `getPublicIdFromUrl` is imported.
					if (imageUrl) {
						const publicId = getPublicIdFromUrl(imageUrl);
						if (publicId) await deleteImage(publicId);
					}
					imageUrl = uploadResult.secure_url;
				}
			} catch (error) {
				console.error('Failed to upload avatar:', error);
			}
		}

		try {
			await db
				.update(member)
				.set({
					fullName: form.data.name,
					nik: form.data.nik || null,
					gender: form.data.gender,
					birthDate: form.data.birthDate ? form.data.birthDate : null,
					phone: form.data.phone || null,
					email: form.data.email || null,
					address: form.data.address || null,
					status: form.data.status || 'active',
					imageUrl: imageUrl,
					updatedAt: new Date()
				})
				.where(eq(member.id, id));
		} catch (err) {
			console.error(err);
			return fail(500, { form, message: 'Gagal mengupdate data' });
		}

		throw redirect(303, '/admin/jamaah');
	},

	delete: async ({ params }) => {
		const id = Number(params.id);
		if (isNaN(id)) return fail(400, { message: 'Invalid ID' });

		try {
			// Optional: Delete image from cloudinary if exists
			const existingMember = await db.query.member.findFirst({
				where: eq(member.id, id)
			});
			if (existingMember?.imageUrl) {
				const publicId = getPublicIdFromUrl(existingMember.imageUrl);
				if (publicId) await deleteImage(publicId);
			}

			await db.delete(member).where(eq(member.id, id));
		} catch (err) {
			console.error(err);
			return fail(500, { message: 'Gagal menghapus data' });
		}

		throw redirect(303, '/admin/jamaah');
	}
};
