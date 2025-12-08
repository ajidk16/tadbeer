import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { notification } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Get user from session (populated by hooks.server.ts)
	const user = locals.user
		? {
				name: locals.user.username || 'User',
				role: (locals.user as any).role || 'jamaah',
				avatar: (locals.user as any).avatar || null
			}
		: {
				name: 'Guest',
				role: 'guest',
				avatar: null
			};

	let notifications: any[] = [];
	if (locals.user?.id) {
		// Fetch notifications for logged in user
		notifications = await db
			.select()
			.from(notification)
			.where(eq(notification.userId, locals.user.id))
			.orderBy(desc(notification.createdAt))
			.limit(10);
	}

	return {
		user,
		notifications
	};
};
