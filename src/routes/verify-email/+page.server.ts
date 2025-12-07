import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { createOtp } from '$lib/server/otp';
import { sendOtpEmail } from '$lib/server/email/nodemailer';

export const load: PageServerLoad = async ({ locals }) => {
	// If not logged in, redirect to login
	if (!locals.user) {
		throw redirect(302, '/auth/login');
	}

	// If already verified, redirect home
	if (locals.user.emailVerified) {
		throw redirect(302, '/');
	}

	return {
		user: locals.user
	};
};

export const actions: Actions = {
	default: async ({ locals }) => {
		if (!locals.user) {
			throw redirect(302, '/auth/login');
		}

		if (locals.user.emailVerified) {
			throw redirect(302, '/');
		}

		try {
			// Generate new OTP
			const otp = await createOtp(locals.user.id, 'email_verification');

			// Send email (assuming username is email as per register logic seen earlier)
			await sendOtpEmail(locals.user.username, otp, 'email_verification');

			return {
				success: true,
				message: 'Email verifikasi telah dikirim ulang.'
			};
		} catch (error) {
			console.error('Error resending verification email:', error);
			return {
				success: false,
				message: 'Gagal mengirim ulang email verifikasi. Silakan coba lagi.'
			};
		}
	}
};
