import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { event, eventAttendance, member, eventRegistration } from '$lib/server/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { eventSchema } from '$lib/schemas';

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
	const members = await db.query.member.findMany({
		where: eq(member.status, 'active')
	});

	const now = new Date();
	const upcomingCount = events.filter(
		(e) => new Date(e.startTime) > now && e.status !== 'cancelled'
	).length;
	const completedCount = events.filter((e) => e.status === 'completed').length;

	const registrations = await db.select().from(eventRegistration);

	const formattedEvents = events.map((e) => ({
		...e,
		date: e.startTime.toISOString(),
		time: e.startTime.toISOString().split('T')[1].slice(0, 5), // HH:mm
		endTime: e.endTime.toISOString().split('T')[1].slice(0, 5),
		category: reverseCategoryMap[e.type] || 'Lainnya',
		attendees: registrations.filter((r) => r.eventId === e.id).length
	}));

	const attendance = await db.select().from(eventAttendance);

	return {
		events: formattedEvents,
		registrations,
		members,
		totalEvents: events.length,
		upcomingCount,
		completedCount,
		eventAttendance: attendance
	};
};

export const actions: Actions = {
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
		console.log('Saving attendance for eventId:', formData);

		const attendees = JSON.parse(attendanceData as string);
		const pid = Number(eventId);

		for (const p of attendees) {
			let memberId: number | null = null;
			let name = p.name;

			if (p.id && p.id.toString().startsWith('member_')) {
				memberId = parseInt(p.id.toString().replace('member_', ''));
			} else if (p.id && p.id.toString().startsWith('guest_')) {
				name = p.name.replace(' (Tamu)', '');
			} else {
				if (!isNaN(parseInt(p.id))) memberId = parseInt(p.id);
			}

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
