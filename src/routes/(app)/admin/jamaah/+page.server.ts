import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { member } from '$lib/server/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { memberSchema } from '$lib/schemas';

export const load: PageServerLoad = async () => {
	const members = await db.select().from(member).orderBy(desc(member.createdAt));

	// Create status stats
	const maleCount = members.filter((m) => m.gender === 'male').length;
	const femaleCount = members.filter((m) => m.gender === 'female').length;
	const activeCount = members.filter((m) => m.status === 'active').length;

	// Initialize superform
	const form = await superValidate(valibot(memberSchema));

	return {
		members,
		totalMembers: members.length,
		maleCount,
		femaleCount,
		activeCount,
		form
	};
};

export const actions: Actions = {
	create: async ({ request }) => {
		const form = await superValidate(request, valibot(memberSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			// TODO: Handle Image Upload if we add it later or parse multipart here
			// For now, assuming standard form without file upload in this specific action,
			// OR we need to handle file separately if it comes in same request.
			// SvelteKit form data handling for files + superform usually requires some setup.
			// Simplify: Insert text data first.

			await db.insert(member).values({
				fullName: form.data.name,
				nik: form.data.nik || null,
				gender: form.data.gender, // Ensuring schema matches DB
				birthDate: form.data.birthDate ? form.data.birthDate : null,
				phone: form.data.phone || null,
				email: form.data.email || null,
				address: form.data.address || null,
				status: form.data.status || 'active'
			});

			return { form };
		} catch (err) {
			console.error(err);
			return fail(500, { form, message: 'Gagal menambah jamaah' });
		}
	},

	update: async ({ request }) => {
		const form = await superValidate(request, valibot(memberSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		if (!form.data.id) {
			return fail(400, { form, message: 'ID tidak ditemukan' });
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
					updatedAt: new Date()
				})
				.where(eq(member.id, form.data.id));

			return { form };
		} catch (err) {
			console.error(err);
			return fail(500, { form, message: 'Gagal update jamaah' });
		}
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id');

		if (!id) return fail(400, { error: 'ID tidak ditemukan' });

		try {
			await db.delete(member).where(eq(member.id, parseInt(id.toString())));
			return { success: true, message: 'Data jamaah berhasil dihapus' };
		} catch (err) {
			console.error(err);
			return fail(500, { error: 'Gagal menghapus data' });
		}
	}
};
