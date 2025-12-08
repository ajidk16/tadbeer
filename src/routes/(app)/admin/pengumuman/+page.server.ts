import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { announcementSchema, khutbahSchema } from '$lib/schemas';
import { db } from '$lib/server/db';
import { announcement, khutbahSchedule, broadcastLog } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	// Fetch real data
	const announcements = await db.select().from(announcement).orderBy(desc(announcement.createdAt));
	const khutbahs = await db.select().from(khutbahSchedule).orderBy(desc(khutbahSchedule.date));
	const broadcasts = await db.select().from(broadcastLog).orderBy(desc(broadcastLog.sentAt));

	// Initialize forms
	const announcementForm = await superValidate(valibot(announcementSchema));
	const khutbahForm = await superValidate(valibot(khutbahSchema));

	return {
		announcements,
		khutbahSchedule: khutbahs,
		broadcastHistory: broadcasts,
		announcementForm,
		khutbahForm
	};
};

export const actions: Actions = {
	// Announcement Actions
	createAnnouncement: async ({ request }) => {
		const form = await superValidate(request, valibot(announcementSchema));
		if (!form.valid) return fail(400, { form });

		const serializableForm = JSON.parse(JSON.stringify(form));

		try {
			await db.insert(announcement).values({
				title: form.data.title,
				content: form.data.content,
				type: (form.data.type as any) || 'info', // Using type as priority/category mapping if needed, or update schema to match enum better
				category: 'pengumuman', // Default category
				priority: form.data.type || 'info',
				// authorId: locals.user?.id, // Use if we have locals.user
				isPublished: true,
				createdAt: new Date(),
				updatedAt: new Date()
			});
			return { form: serializableForm, success: true, message: 'Pengumuman berhasil dibuat' };
		} catch (error) {
			console.error(error);
			return fail(500, { form: serializableForm, message: 'Gagal membuat pengumuman' });
		}
	},

	updateAnnouncement: async ({ request }) => {
		const form = await superValidate(request, valibot(announcementSchema));
		if (!form.valid) return fail(400, { form });

		const serializableForm = JSON.parse(JSON.stringify(form));
		if (!form.data.id) return fail(400, { form: serializableForm, message: 'ID tidak ditemukan' });

		try {
			await db
				.update(announcement)
				.set({
					title: form.data.title,
					content: form.data.content,
					priority: form.data.type,
					updatedAt: new Date()
				})
				.where(eq(announcement.id, form.data.id));
			return { form: serializableForm, success: true, message: 'Pengumuman berhasil diperbarui' };
		} catch (error) {
			console.error(error);
			return fail(500, { form: serializableForm, message: 'Gagal memperbarui pengumuman' });
		}
	},

	createKhutbah: async ({ request }) => {
		const form = await superValidate(request, valibot(khutbahSchema));
		if (!form.valid) return fail(400, { form });

		const serializableForm = JSON.parse(JSON.stringify(form));

		try {
			await db.insert(khutbahSchedule).values({
				date: form.data.date,
				khatib: form.data.khatib,
				imam: form.data.imam,
				muadzin: form.data.muadzin,
				theme: form.data.theme
			});
			return { form: serializableForm, success: true, message: 'Jadwal khutbah berhasil dibuat' };
		} catch (error) {
			console.error(error);
			return fail(500, { form: serializableForm, message: 'Gagal membuat jadwal khutbah' });
		}
	},

	updateKhutbah: async ({ request }) => {
		const form = await superValidate(request, valibot(khutbahSchema));
		if (!form.valid) return fail(400, { form });

		const serializableForm = JSON.parse(JSON.stringify(form));
		if (!form.data.id) return fail(400, { form: serializableForm, message: 'ID tidak ditemukan' });

		try {
			await db
				.update(khutbahSchedule)
				.set({
					date: form.data.date,
					khatib: form.data.khatib,
					imam: form.data.imam,
					muadzin: form.data.muadzin,
					theme: form.data.theme,
					updatedAt: new Date()
				})
				.where(eq(khutbahSchedule.id, form.data.id));
			return {
				form: serializableForm,
				success: true,
				message: 'Jadwal khutbah berhasil diperbarui'
			};
		} catch (error) {
			console.error(error);
			return fail(500, { form: serializableForm, message: 'Gagal memperbarui jadwal khutbah' });
		}
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id')); // IDs are serial/integer
		// But wait, announcement uses 'serial' -> integer.
		// My earlier mock for announcement used string ID '1'.
		// The schema says `id: serial('id').primaryKey()`.
		// However, I see `drizzle-orm` usually returns numbers for serial.
		// Let's assume number.
		// Wait, did I delete separate delete actions or unified?
		// The UI calls `?/delete`. I need to know WHICH item to delete (announcement or khutbah).
		// The UI uses a single delete modal but might need to know the context (tab).
		// Currently the UI in `+page.svelte` uses `selectedItem?.id` for delete.
		// And `?/delete` action.
		// I must discern which table to delete from.
		// OR I should have separate delete actions: `deleteAnnouncement` and `deleteKhutbah`.
		// I will update the Svelte file to use separate actions to be safe, or pass a `type` in the formData.

		// For now, let's implement `deleteAnnouncement` and `deleteKhutbah`.
		return fail(400, { message: 'Action deprecated, use specific delete actions' });
	},

	deleteAnnouncement: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) return fail(400, { message: 'Invalid ID' });
		try {
			await db.delete(announcement).where(eq(announcement.id, id));
			return { success: true, message: 'Pengumuman dihapus' };
		} catch (e) {
			return fail(500, { message: 'Gagal menghapus' });
		}
	},

	deleteKhutbah: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) return fail(400, { message: 'Invalid ID' });
		try {
			await db.delete(khutbahSchedule).where(eq(khutbahSchedule.id, id));
			return { success: true, message: 'Jadwal dihapus' };
		} catch (e) {
			return fail(500, { message: 'Gagal menghapus' });
		}
	}
};
