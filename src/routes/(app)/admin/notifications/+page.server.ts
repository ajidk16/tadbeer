import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { notification } from '$lib/server/db/schema';
import { desc, eq, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	// In a real app, use locals.user.id
	// For now, let's assume we fetch all notifications for demo or a fixed user
	// const userId = locals.user?.id;
	// if (!userId) return { notifications: [] };

	// Mocking user context by fetching all or specific user's notifications if we had auth
	const notifications = await db.select().from(notification).orderBy(desc(notification.createdAt));

	return {
		notifications
	};
};

export const actions: Actions = {
	markRead: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) return fail(400, { message: 'Invalid ID' });

		try {
			await db.update(notification).set({ read: true }).where(eq(notification.id, id));
			return { success: true };
		} catch (e) {
			console.error(e);
			return fail(500, { message: 'Failed to mark as read' });
		}
	},

	markAllRead: async () => {
		try {
			// update many
			// access user from locals in real app
			await db.update(notification).set({ read: true });
			return { success: true };
		} catch (e) {
			console.error(e);
			return fail(500, { message: 'Failed to mark all as read' });
		}
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) return fail(400, { message: 'Invalid ID' });

		try {
			await db.delete(notification).where(eq(notification.id, id));
			return { success: true };
		} catch (e) {
			console.error(e);
			return fail(500, { message: 'Failed to delete' });
		}
	}
};
