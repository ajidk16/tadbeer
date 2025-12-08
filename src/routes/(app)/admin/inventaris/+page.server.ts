import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { inventoryItem, assetLending, assetMaintenance } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { lendingSchema, maintenanceSchema } from '$lib/schemas';

export const load: PageServerLoad = async () => {
	const assets = await db.query.inventoryItem.findMany({
		orderBy: [desc(inventoryItem.createdAt)],
		limit: 10 // Just fetching simplified list for now
	});

	const assetsgood = await db.query.inventoryItem.findMany({
		where: eq(inventoryItem.condition, 'good'),
		orderBy: [desc(inventoryItem.createdAt)]
	});

	const assetsmaintenance = await db.query.inventoryItem.findMany({
		where: eq(inventoryItem.condition, 'maintenance'),
		orderBy: [desc(inventoryItem.createdAt)]
	});

	// console.log('Assets in good condition:', assetsgood);

	// Fetch Lending Data with Asset relation using Drizzle Query API
	const lendings = await db.query.assetLending.findMany({
		with: {
			asset: true
		},
		orderBy: [desc(assetLending.borrowDate)]
	});

	const maintenance = await db.query.assetMaintenance.findMany({
		with: {
			asset: true
		},
		orderBy: [desc(assetMaintenance.maintenanceDate)]
	});

	// Calculate stats
	const totalAssets = assets.reduce((acc, curr) => acc + curr.quantity, 0);
	const totalValue = assets.reduce((acc, curr) => acc + Number(curr.price || 0) * curr.quantity, 0);
	const inMaintenance = assets.filter((a) => a.condition === 'maintenance').length;
	const borrowed = lendings.filter((l) => l.status === 'borrowed').length;

	// Initialize forms
	const lendingForm = await superValidate(valibot(lendingSchema));
	const maintenanceForm = await superValidate(valibot(maintenanceSchema));

	// Map for frontend simpler consumption if needed, or pass as is.
	// The frontend expects: { assetName: ..., assetCode: ... } etc inside lending object.
	// Since we now have `asset: { name: ..., code: ... }` nested, we might need to map it OR update frontend.
	// Updating mapping here is safer to preserve frontend contract.

	const lendingsMapped = lendings.map((l) => ({
		...l,
		assetName: l.asset?.name || 'Unknown',
		assetCode: l.asset?.code || '-'
	}));

	const maintenanceMapped = maintenance.map((m) => ({
		...m,
		assetName: m.asset?.name || 'Unknown',
		assetCode: m.asset?.code || '-'
	}));

	return {
		assets,
		lendings: lendingsMapped,
		maintenance: maintenanceMapped,
		stats: {
			totalAssets,
			totalValue,
			inMaintenance,
			borrowed
		},
		lendingForm,
		maintenanceForm,
		assetsgood,
		assetsmaintenance
	};
};

export const actions: Actions = {
	// Asset Actions
	deleteAsset: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));

		if (!id) return fail(400, { message: 'Invalid ID' });

		try {
			await db.delete(inventoryItem).where(eq(inventoryItem.id, id));
			return { success: true, message: 'Aset berhasil dihapus' };
		} catch (error) {
			console.error('Error deleting asset:', error);
			return fail(500, {
				message: 'Gagal menghapus aset. Pastikan tidak ada data peminjaman terkait.'
			});
		}
	},

	// Lending Actions
	createLending: async ({ request }) => {
		const form = await superValidate(request, valibot(lendingSchema));
		if (!form.valid) return fail(400, { form });

		const serializableForm = JSON.parse(JSON.stringify(form));

		try {
			await db.insert(assetLending).values({
				assetId: form.data.assetId,
				borrowerName: form.data.borrowerName,
				borrowerContact: form.data.borrowerContact,
				borrowDate: form.data.borrowDate ? new Date(form.data.borrowDate) : new Date(),
				notes: form.data.notes,
				status: 'borrowed'
			});
			return { form: serializableForm, success: true, message: 'Peminjaman berhasil dicatat' };
		} catch (error) {
			console.error(error);
			return fail(500, { form: serializableForm, message: 'Gagal mencatat peminjaman' });
		}
	},

	returnLending: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) return fail(400, { message: 'Invalid ID' });

		try {
			await db
				.update(assetLending)
				.set({
					status: 'returned',
					returnDate: new Date()
				})
				.where(eq(assetLending.id, id));
			return { success: true, message: 'Aset telah dikembalikan' };
		} catch (error) {
			console.error(error);
			return fail(500, { message: 'Gagal memproses pengembalian' });
		}
	},

	// Maintenance Actions
	createMaintenance: async ({ request }) => {
		const form = await superValidate(request, valibot(maintenanceSchema));
		if (!form.valid) return fail(400, { form });

		const serializableForm = JSON.parse(JSON.stringify(form));

		try {
			await db.insert(assetMaintenance).values({
				assetId: form.data.assetId,
				maintenanceDate: form.data.maintenanceDate,
				description: form.data.description,
				cost: form.data.cost ? String(form.data.cost) : '0',
				performer: form.data.performer,
				status: (form.data.status as any) || 'scheduled',
				notes: form.data.notes
			});
			// Optionally update asset condition
			if (form.data.status === 'in_progress') {
				await db
					.update(inventoryItem)
					.set({ condition: 'maintenance' })
					.where(eq(inventoryItem.id, form.data.assetId));
			}
			return { form: serializableForm, success: true, message: 'Maintenance berhasil dijadwalkan' };
		} catch (error) {
			console.error(error);
			return fail(500, { form: serializableForm, message: 'Gagal menyimpan data maintenance' });
		}
	},

	completeMaintenance: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		const cost = formData.get('realCost') as string; // optionally update cost on completion

		if (!id) return fail(400, { message: 'Invalid ID' });

		try {
			await db
				.update(assetMaintenance)
				.set({
					status: 'completed',
					cost: cost ? cost : undefined
				})
				.where(eq(assetMaintenance.id, id));

			// Revert asset condition to good? (Optional logic)
			// await db.update(inventoryItem).set({ condition: 'good' }).where(...);

			return { success: true, message: 'Maintenance selesai' };
		} catch (error) {
			console.error(error);
			return fail(500, { message: 'Gagal menyelesaikan maintenance' });
		}
	},

	// Export Action - trigger redirect to export endpoint
	exportCSV: async () => {
		return { success: true, redirect: '/admin/inventaris/export' };
	}
};
