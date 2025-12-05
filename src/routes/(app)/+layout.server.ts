import type { LayoutServerLoad } from './$types';

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

	return {
		user
	};
};
