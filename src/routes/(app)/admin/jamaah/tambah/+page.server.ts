import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { memberSchema } from '$lib/schemas';
import { db } from '$lib/server/db';
import { member } from '$lib/server/db/schema';
import { uploadImageFromBuffer } from '$lib/server/cloudinary';

export const load: PageServerLoad = async () => {
	const form = await superValidate(valibot(memberSchema));
	return { form };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const form = await superValidate(formData, valibot(memberSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		let avatarUrl = null;
		const avatarFile = formData.get('avatar') as File;

		if (avatarFile && avatarFile.size > 0 && avatarFile.name !== 'undefined') {
			try {
				const buffer = Buffer.from(await avatarFile.arrayBuffer());
				const uploadResult = await uploadImageFromBuffer(buffer, 'minimasjid/members');
				if (uploadResult?.secure_url) {
					avatarUrl = uploadResult.secure_url;
				}
			} catch (error) {
				console.error('Failed to upload avatar:', error);
				// Continue without avatar or return error if critical
			}
		}

		try {
			await db.insert(member).values({
				fullName: form.data.name,
				nik: form.data.nik || null,
				gender: form.data.gender,
				birthDate: form.data.birthDate ? form.data.birthDate : null,
				phone: form.data.phone || null,
				email: form.data.email || null,
				address: form.data.address || null,
				status: form.data.status || 'active'
				// The schema.ts has avatarUrl, but I don't see it in memberSchema validation.
				// I'll add it to the insert if the schema supports it.
				// Based on schema.ts view earlier: "109: 	avatarUrl: text('avatar_url')," in `user` table?
				// Wait, `member` table didn't have `avatarUrl` visible in my snippet read earlier?
				// Let's check schema.ts again or assume it's not there and maybe I need to add it?
				// Just checked schema.ts snippet from earlier.
				// member table: fullName, nik, phone, address, birthDate, joinDate, status.
				// It DOES NOT have avatarUrl listed in the snippet I saw (lines 194-207).
				// The `user` table (lines 100-114) has `avatarUrl`.
				// Use Case: Jamaah management usually implies independent members, not necessarily system users.
				// If I strictly follow the prompt "foto profil menggunakan cloudinary", I need a place to store it.
				// I will ADD `imageUrl` or `avatarUrl` to `member` table first if it's missing.
				// I'll pause insert here to check schema again or fix it.
				// Re-reading task 2: "foto profil menggunakan cloudinary".
				// Schema update required if missing.
			});
		} catch (err) {
			console.error(err);
			return fail(500, { form, message: 'Gagal menyimpan data' });
		}

		throw redirect(303, '/admin/jamaah');
	}
};
