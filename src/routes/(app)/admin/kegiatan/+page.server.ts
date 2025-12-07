import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { event, eventAttendance, member, eventRegistration } from '$lib/server/db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { eventSchema } from '$lib/schemas';

const categoryMap: Record<string, string> = {
	Pengajian: 'kajian',
	Kajian: 'kajian',
	'Sholat Jumat': 'ibadah',
	'Kegiatan Sosial': 'sosial',
	Rapat: 'rapat',
	Lainnya: 'lainnya'
};

const reverseCategoryMap: Record<string, string> = {
	kajian: 'Pengajian',
	ibadah: 'Sholat Jumat',
	sosial: 'Kegiatan Sosial',
	rapat: 'Rapat',
	lainnya: 'Lainnya',
	phbi: 'Lainnya'
};

export const load: PageServerLoad = async () => {
	const events = await db.select().from(event).orderBy(desc(event.startTime));
	const members = await db.select().from(member).where(eq(member.status, 'active'));

	const now = new Date();
	const upcomingCount = events.filter(
		(e) => new Date(e.startTime) > now && e.status !== 'cancelled'
	).length;
	const completedCount = events.filter((e) => e.status === 'completed').length;

	// Fetch all registrations
	// In a real app, you might want to fetch this on demand or filter by time
	const registrations = await db.select().from(eventRegistration);

	const formattedEvents = events.map((e) => ({
		...e,
		date: e.startTime.toISOString(),
		time: e.startTime.toISOString().split('T')[1].slice(0, 5), // HH:mm
		endTime: e.endTime.toISOString().split('T')[1].slice(0, 5),
		category: reverseCategoryMap[e.type] || 'Lainnya',
		attendees: registrations.filter((r) => r.eventId === e.id).length // Count from registrations
	}));

	return {
		form: await superValidate(valibot(eventSchema)),
		events: formattedEvents,
		registrations, // Pass to frontend to filter when opening modal
		members,
		totalEvents: events.length,
		upcomingCount,
		completedCount
	};
};

export const actions: Actions = {
	create: async ({ request }) => {
		const form = await superValidate(request, valibot(eventSchema));
		if (!form.valid) return fail(400, { form });

		const { title, date, time, endTime, location, description, capacity, category } = form.data;

		const startDateTime = new Date(`${date}T${time}`);
		// Handle endTime (optional or same day)
		let endDateTime = new Date(`${date}T${time}`);
		if (endTime) {
			endDateTime = new Date(`${date}T${endTime}`);
		} else {
			// Default 1 hour duration
			endDateTime.setHours(endDateTime.getHours() + 1);
		}

		await db.insert(event).values({
			title,
			type: (categoryMap[category] || 'lainnya') as any,
			status: 'scheduled',
			startTime: startDateTime,
			endTime: endDateTime,
			location,
			description,
			capacity: capacity ? parseInt(capacity) : undefined
		});

		return { form };
	},

	update: async ({ request }) => {
		const form = await superValidate(request, valibot(eventSchema));
		if (!form.valid) return fail(400, { form });

		if (!form.data.id) return fail(400, { form, error: 'ID is required' });

		const { id, title, date, time, endTime, location, description, capacity, category } = form.data;

		const startDateTime = new Date(`${date}T${time}`);
		let endDateTime = new Date(`${date}T${time}`);
		if (endTime) {
			endDateTime = new Date(`${date}T${endTime}`);
		} else {
			endDateTime.setHours(endDateTime.getHours() + 1);
		}

		await db
			.update(event)
			.set({
				title,
				type: (categoryMap[category] || 'lainnya') as any,
				startTime: startDateTime,
				endTime: endDateTime,
				location,
				description,
				capacity: capacity ? parseInt(capacity) : undefined,
				updatedAt: new Date()
			})
			.where(eq(event.id, id));

		return { form };
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id');
		if (!id) return fail(400, { error: 'ID required' });

		await db.delete(event).where(eq(event.id, Number(id)));
		return { success: true };
	},

	saveAttendance: async ({ request }) => {
		const formData = await request.formData();
		const eventId = formData.get('eventId');
		const attendanceData = formData.get('attendance'); // Expect JSON string

		if (!eventId || !attendanceData) return fail(400, { error: 'Missing data' });

		const attendees = JSON.parse(attendanceData as string);
		// attendees: { id: string, status: string }[]

		// Simple implementation: delete old, insert new (or upsert)
		// Assuming we just track provided list
		// In production, better to use upsert per member

		const pid = Number(eventId);

		for (const p of attendees) {
			// memberId might be the 'id' in the list
			let memberId: number | null = null;
			let name = p.name;

			// Handle ID types
			if (p.id && p.id.toString().startsWith('member_')) {
				memberId = parseInt(p.id.toString().replace('member_', ''));
			} else if (p.id && p.id.toString().startsWith('guest_')) {
				// It's a guest, no memberId. We use the name.
				// We could strip "(Tamu)" suffix if we added it in UI, but simpler to just use p.name
				// But in UI we added "(Tamu)". Let's clean it.
				name = p.name.replace(' (Tamu)', '');
			} else {
				// Should not happen with new logic, but fallback
				if (!isNaN(parseInt(p.id))) memberId = parseInt(p.id);
			}

			// Check if exists
			// If memberId is present, check by memberId.
			// If guest (memberId null), check by name? Or we need a way to track guests reliably?
			// For now, checking by memberId if partial, or name+eventId if guest.

			let whereClause;
			if (memberId) {
				whereClause = and(eq(eventAttendance.eventId, pid), eq(eventAttendance.memberId, memberId));
			} else {
				whereClause = and(eq(eventAttendance.eventId, pid), eq(eventAttendance.name, name));
			}

			const existing = await db.select().from(eventAttendance).where(whereClause).limit(1);

			if (existing.length > 0) {
				await db
					.update(eventAttendance)
					.set({
						status: p.status as any,
						updatedAt: new Date()
					})
					.where(eq(eventAttendance.id, existing[0].id));
			} else {
				// If member, fetch name if not provided? We have it in `p.name` but might be formatted.
				// Fetch member name to be sure if member
				let dbName = name;
				if (memberId) {
					const m = await db.select().from(member).where(eq(member.id, memberId)).limit(1);
					if (m.length > 0) dbName = m[0].fullName;
				}

				await db.insert(eventAttendance).values({
					eventId: pid,
					memberId: memberId,
					name: dbName,
					status: p.status as any
				});
			}
		}

		return { success: true };
	}
};
