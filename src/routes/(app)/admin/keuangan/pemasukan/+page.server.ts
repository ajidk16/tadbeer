import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { transactionSchema } from '$lib/schemas';
import { uploadImageFromBuffer, deleteImage, getPublicIdFromUrl } from '$lib/server/cloudinary';
import { eq, desc } from 'drizzle-orm';

const TRANSACTION_TYPE = 'income';

export const load = async () => {
	const transactions = await db
		.select()
		.from(table.financialTransaction)
		.where(eq(table.financialTransaction.type, TRANSACTION_TYPE))
		.orderBy(desc(table.financialTransaction.date));

	// Stats calculation
	const totalIncome = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
	const transactionCount = transactions.length;

	// Get unique categories for filter
	const categories = [...new Set(transactions.map((t) => t.category))].sort();

	const form = await superValidate(valibot(transactionSchema));

	console.log('Loaded income transactions:', categories);

	return {
		form,
		transactions,
		totalIncome,
		transactionCount,
		categories
	};
};

export const actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const form = await superValidate(formData, valibot(transactionSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		let proofUrl: string | undefined;
		const proofFile = formData.get('proof') as File;

		if (proofFile && proofFile.size > 0) {
			try {
				const buffer = Buffer.from(await proofFile.arrayBuffer());
				const uploadResult = await uploadImageFromBuffer(buffer, 'tadbeer/finance/income');
				proofUrl = uploadResult.secure_url;
			} catch (error) {
				console.error('Image upload failed:', error);
				return fail(500, { form, message: 'Gagal mengupload bukti transaksi' });
			}
		}

		try {
			await db.insert(table.financialTransaction).values({
				type: TRANSACTION_TYPE,
				category: form.data.category as any, // Cast to enum type if needed or ensure validation matches
				amount: form.data.amountRaw.toString(),
				description: form.data.description,
				notes: form.data.notes,
				date: form.data.date,
				proofUrl: proofUrl
				// recordedBy: locals.user?.id // Uncomment if auth is ready/needed
			});
		} catch (error) {
			console.error('Database insert failed:', error);
			return fail(500, { form, message: 'Gagal menyimpan data ke database' });
		}

		return { form, message: 'Data pemasukan berhasil ditambahkan' };
	},

	update: async ({ request }) => {
		const formData = await request.formData();
		const form = await superValidate(formData, valibot(transactionSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		if (!form.data.id) {
			return fail(400, { form, message: 'ID transaksi tidak ditemukan' });
		}

		let proofUrl: string | undefined;
		const proofFile = formData.get('proof') as File;

		try {
			// Get existing transaction to find old image
			const [existingTx] = await db
				.select()
				.from(table.financialTransaction)
				.where(eq(table.financialTransaction.id, form.data.id))
				.limit(1);

			if (!existingTx) {
				return fail(404, { form, message: 'Transaksi tidak ditemukan' });
			}

			proofUrl = existingTx.proofUrl || undefined;

			if (proofFile && proofFile.size > 0) {
				const buffer = Buffer.from(await proofFile.arrayBuffer());
				const uploadResult = await uploadImageFromBuffer(buffer, 'tadbeer/finance/income');
				proofUrl = uploadResult.secure_url;

				// Delete old image if exists
				if (existingTx.proofUrl) {
					const publicId = getPublicIdFromUrl(existingTx.proofUrl);
					if (publicId) await deleteImage(publicId);
				}
			}

			await db
				.update(table.financialTransaction)
				.set({
					category: form.data.category as any,
					amount: form.data.amountRaw.toString(),
					description: form.data.description,
					notes: form.data.notes,
					date: form.data.date,
					proofUrl: proofUrl,
					updatedAt: new Date()
				})
				.where(eq(table.financialTransaction.id, form.data.id));
		} catch (error) {
			console.error('Update failed:', error);
			return fail(500, { form, message: 'Gagal memperbarui data' });
		}

		return { form, message: 'Data pemasukan berhasil diperbarui' };
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));

		if (!id) {
			return fail(400, { message: 'ID tidak valid' });
		}

		try {
			const [existingTx] = await db
				.select()
				.from(table.financialTransaction)
				.where(eq(table.financialTransaction.id, id))
				.limit(1);

			if (!existingTx) {
				return fail(404, { message: 'Transaksi tidak ditemukan' });
			}

			if (existingTx.proofUrl) {
				const publicId = getPublicIdFromUrl(existingTx.proofUrl);
				if (publicId) await deleteImage(publicId);
			}

			await db.delete(table.financialTransaction).where(eq(table.financialTransaction.id, id));
		} catch (error) {
			console.error('Delete failed:', error);
			return fail(500, { message: 'Gagal menghapus data' });
		}

		return { success: true, message: 'Data berhasil dihapus' };
	}
};
