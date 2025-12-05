import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();

		const date = formData.get('date') as string;
		const category = formData.get('category') as string;
		const amountRaw = formData.get('amountRaw') as string;
		const description = formData.get('description') as string;
		const notes = formData.get('notes') as string;

		if (!date || !category || !amountRaw || !description) {
			return fail(400, {
				error: 'Semua field wajib harus diisi'
			});
		}

		const amount = Number(amountRaw);
		if (isNaN(amount) || amount <= 0) {
			return fail(400, { error: 'Jumlah harus lebih dari 0' });
		}

		// TODO: Save to database
		console.log('Saving expense:', { date, category, amount, description, notes });

		throw redirect(303, '/keuangan/pengeluaran');
	}
};
