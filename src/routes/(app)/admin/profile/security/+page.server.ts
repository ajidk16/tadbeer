import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { securitySchema } from '$lib/schemas';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { logAudit } from '$lib/server/audit';
import { lucia } from '$lib/server/auth';
import { verify, hash } from '@node-rs/argon2';

export const load = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/auth/login');

	const form = await superValidate(valibot(securitySchema));

	return {
		form
	};
};

export const actions = {
	default: async ({ request, locals, cookies }) => {
		if (!locals.user) return fail(401);
		const form = await superValidate(request, valibot(securitySchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		if (form.data.newPassword !== form.data.confirmPassword) {
			return fail(400, { form, message: 'Passwords do not match' });
		}

		try {
			const user = await db.query.user.findFirst({
				where: eq(table.user.id, locals.user.id)
			});

			if (!user) return fail(404, { message: 'User not found' });

			const validPassword = await verify(user.passwordHash, form.data.currentPassword, {
				memoryCost: 19456,
				timeCost: 2,
				outputLen: 32,
				parallelism: 1
			});

			if (!validPassword) {
				return fail(400, { form, message: 'Incorrect current password' });
			}

			const passwordHash = await hash(form.data.newPassword, {
				memoryCost: 19456,
				timeCost: 2,
				outputLen: 32,
				parallelism: 1
			});

			await db
				.update(table.user)
				.set({
					passwordHash,
					updatedAt: new Date()
				})
				.where(eq(table.user.id, locals.user.id));

			// Invalidate all sessions
			await lucia.invalidateUserSessions(locals.user.id);

			// Create new session for current user
			const session = await lucia.createSession(locals.user.id, {});
			const sessionCookie = lucia.createSessionCookie(session.id);

			cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes
			});

			await logAudit(locals.user.id, 'UPDATE', 'user', locals.user.id, {
				newValues: { passwordChanged: true, reason: 'user_initiated' }
			});

			return { form, message: 'Password updated successfully' };
		} catch (error) {
			console.error('Update password failed:', error);
			return fail(500, { form, message: 'Failed to update password' });
		}
	}
};
