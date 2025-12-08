import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { profileSchema, securitySchema } from '$lib/schemas';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, desc, count } from 'drizzle-orm';
import { logAudit } from '$lib/server/audit';
import { invalidateSession } from '$lib/server/auth';
import { verify, hash } from '@node-rs/argon2';

export const load = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/auth/login');

	const user = await db.query.user.findFirst({
		where: eq(table.user.id, locals.user.id),
		with: {
			role: true
		}
	});

	if (!user) throw redirect(302, '/auth/login');

	const sessions = await db
		.select()
		.from(table.session)
		.where(eq(table.session.userId, user.id))
		.orderBy(desc(table.session.expiresAt));

	const [donationStats] = await db
		.select({ count: count() })
		.from(table.donation)
		.where(eq(table.donation.verifiedBy, user.id));

	const [eventStats] = await db.select({ count: count() }).from(table.event);
	// Note: Currently no relation between user and event attendance.
	// Returning total events for now or 0 if we want strict user stats.
	// For "Attended", we need an event_attendance table.

	const profileForm = await superValidate(
		{
			fullName: user.fullName || '',
			phone: user.phone || '',
			about: user.about || ''
		},
		valibot(profileSchema)
	);

	const securityForm = await superValidate(valibot(securitySchema));

	return {
		user,
		sessions,
		stats: {
			donations: donationStats?.count || 0,
			events: eventStats?.count || 0 // Placeholder until event attendance is implemented
		},
		profileForm,
		securityForm
	};
};

export const actions = {
	updateProfile: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		const form = await superValidate(request, valibot(profileSchema));
		if (!form.valid) return fail(400, { form });

		try {
			await db
				.update(table.user)
				.set({
					fullName: form.data.fullName,
					phone: form.data.phone,
					about: form.data.about,
					updatedAt: new Date()
				})
				.where(eq(table.user.id, locals.user.id));

			await logAudit(locals.user.id, 'UPDATE', 'user', locals.user.id, {
				newValues: form.data
			});

			return { form, message: 'Profile updated successfully' };
		} catch (error) {
			console.error('Update profile failed:', error);
			return fail(500, { form, message: 'Failed to update profile' });
		}
	},

	updatePassword: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		const form = await superValidate(request, valibot(securitySchema));
		if (!form.valid) return fail(400, { form });

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
				// recommended minimum parameters
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

			// Invalidate all user sessions except current one
			const allSessions = await db
				.select()
				.from(table.session)
				.where(eq(table.session.userId, locals.user.id));

			for (const session of allSessions) {
				if (session.id !== locals.session?.id) {
					await invalidateSession(session.id);
				}
			}

			await logAudit(locals.user.id, 'UPDATE', 'user', locals.user.id, {
				newValues: { passwordChanged: true }
			});

			return { form, message: 'Password updated successfully. Please login again.' };
		} catch (error) {
			console.error('Update password failed:', error);
			return fail(500, { form, message: 'Failed to update password' });
		}
	},

	revokeSession: async ({ request, locals }) => {
		if (!locals.user) return fail(401);
		const formData = await request.formData();
		const sessionId = String(formData.get('sessionId'));

		try {
			await invalidateSession(sessionId);
			await logAudit(locals.user.id, 'DELETE', 'session', sessionId);
			return { success: true, message: 'Session revoked' };
		} catch (error) {
			console.error('Revoke session failed:', error);
			return fail(500, { message: 'Failed to revoke session' });
		}
	},

	signOut: async ({ locals, cookies }) => {
		if (!locals.session) return fail(401);
		await invalidateSession(locals.session.id);
		cookies.delete('auth-session', { path: '/' });
		throw redirect(302, '/auth/login');
	}
};
