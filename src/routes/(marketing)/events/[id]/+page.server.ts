import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { event, eventRegistration } from '$lib/server/db/schema';
import { eq, ne, desc, and } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { object, string, minLength, email, optional } from 'valibot';

// Schema for registration form
const registrationSchema = object({
	name: string([minLength(3, 'Nama harus diisi minimal 3 karakter')]),
	email: optional(string([email('Email tidak valid')])),
	phone: string([minLength(10, 'Nomor WhatsApp tidak valid')]),
	notes: optional(string())
});

export const load: PageServerLoad = async ({ params }) => {
	const eventId = parseInt(params.id);

	if (isNaN(eventId)) {
		error(404, 'Kegiatan tidak ditemukan');
	}

	const eventData = await db.query.event.findFirst({
		where: eq(event.id, eventId)
	});

	if (!eventData) {
		error(404, 'Kegiatan tidak ditemukan');
	}

	// Fetch other upcoming events for sidebar/footer
	const otherEvents = await db.query.event.findMany({
		where: and(ne(event.id, eventId), ne(event.status, 'cancelled')),
		orderBy: [desc(event.startTime)],
		limit: 3
	});

	const form = await superValidate(valibot(registrationSchema));

	return {
		event: eventData,
		otherEvents,
		form
	};
};

export const actions: Actions = {
	register: async ({ request, params }) => {
		const form = await superValidate(request, valibot(registrationSchema));
		const eventId = parseInt(params.id);

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await db.insert(eventRegistration).values({
				eventId,
				name: form.data.name,
				email: form.data.email,
				phone: form.data.phone,
				notes: form.data.notes
			});

			return { form };
		} catch (err) {
			console.error('Registration error:', err);
			return fail(500, { form, message: 'Gagal mendaftar kegiatan. Silakan coba lagi.' });
		}
	}
};
