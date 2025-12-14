/* eslint-disable @typescript-eslint/no-explicit-any */
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { eventSchema } from '$lib/schemas';
import { db } from '$lib/server/db';
import { event } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { deleteImage, getPublicIdFromUrl, uploadImageFromBuffer } from '$lib/server/cloudinary';

export const load: PageServerLoad = async ({ params }) => {
	const { id } = params;

	let form;

	if (id && id !== 'new') {
		const existingEvent = await db.query.event.findFirst({
			where: eq(event.id, Number(id))
		});

		if (!existingEvent) {
			// Handle not found
			form = await superValidate(valibot(eventSchema));
		} else {
			// Map DB fields to schema fields
			const formData = {
				...existingEvent,
				date: existingEvent.startTime.toISOString().split('T')[0],
				time: existingEvent.startTime.toLocaleTimeString('en-GB', {
					hour: '2-digit',
					minute: '2-digit'
				}),
				endTime: existingEvent.endTime.toLocaleTimeString('en-GB', {
					hour: '2-digit',
					minute: '2-digit'
				}),
				capacity: existingEvent.capacity?.toString(),
				image: existingEvent.imageUrl || '',
				location: existingEvent.location ?? undefined,
				description: existingEvent.description ?? undefined,
				speaker: existingEvent.speaker ?? undefined,
				category: existingEvent.type // Map 'type' to 'category'
			};
			form = await superValidate(formData, valibot(eventSchema));
		}
	} else {
		form = await superValidate(valibot(eventSchema));
	}

	return {
		form
	};
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const form = await superValidate(formData, valibot(eventSchema));

		if (!form.valid) {
			delete form.data.image;
			return fail(400, { form });
		}

		try {
			const { date, time, endTime, ...rest } = form.data;

			const startTimeDate = new Date(`${date}T${time}`);
			const endTimeDate = endTime
				? new Date(`${date}T${endTime}`)
				: new Date(startTimeDate.getTime() + 60 * 60 * 1000);

			let imageUrl = '';
			const imageFile = formData.get('image');

			if (imageFile && imageFile instanceof File && imageFile.size > 0) {
				const buffer = Buffer.from(await imageFile.arrayBuffer());
				try {
					const uploadResult = await uploadImageFromBuffer(buffer, 'minimasjid/events');
					if (uploadResult && uploadResult.secure_url) {
						imageUrl = uploadResult.secure_url;
					}
				} catch (err) {
					console.error('Image upload failed:', err);
					delete form.data.image;
					return fail(500, {
						form,
						message:
							'Gagal mengunggah gambar. Silakan coba lagi atau gunakan gambar yang lebih kecil.'
					});
				}
			}

			await db.insert(event).values({
				...rest,
				startTime: startTimeDate,
				endTime: endTimeDate,
				capacity: rest.capacity ? Number(rest.capacity) : 0,
				type: rest.category as any,
				imageUrl: imageUrl || undefined
			});
		} catch (error) {
			console.error(error);
			delete form.data.image;
			return fail(500, { form, message: 'Gagal menyimpan kegiatan' });
		}

		throw redirect(303, '/admin/kegiatan');
	},

	update: async ({ request }) => {
		const formData = await request.formData();
		const form = await superValidate(formData, valibot(eventSchema));

		if (!form.valid) {
			delete form.data.image;
			return fail(400, { form });
		}

		if (!form.data.id) {
			delete form.data.image;
			return fail(400, { form, message: 'ID missing for update' });
		}

		try {
			const { date, time, endTime, ...rest } = form.data;

			const startTimeDate = new Date(`${date}T${time}`);
			const endTimeDate = endTime
				? new Date(`${date}T${endTime}`)
				: new Date(startTimeDate.getTime() + 60 * 60 * 1000);

			let imageUrl = undefined; // Undefined means don't update key in some ORMs, but Drizzle updates if passed.
			// We need to construct the update object conditionally or check if image provided.
			// Ideally we query existing if we need to delete old one, but for now just overwrite.
			const existingEvent = await db.query.event.findFirst({
				where: eq(event.id, form.data.id)
			});

			if (!existingEvent) {
				delete form.data.image;
				return fail(404, { form, message: 'Kegiatan tidak ditemukan' });
			}

			const imageFile = formData.get('image') as File;

			if (imageFile && imageFile instanceof File && imageFile.size > 0) {
				const buffer = Buffer.from(await imageFile.arrayBuffer());

				try {
					const uploadResult = await uploadImageFromBuffer(buffer, 'minimasjid/events');
					imageUrl = uploadResult.secure_url;

					// Only delete old image after successful upload
					if (existingEvent.imageUrl) {
						const oldImageId = getPublicIdFromUrl(existingEvent.imageUrl);
						if (oldImageId) {
							try {
								await deleteImage(oldImageId);
							} catch (deleteErr) {
								console.error('Failed to delete old image:', deleteErr);
								// Continue anyway, new image uploaded successfully
							}
						}
					}
				} catch (err) {
					console.error('Image upload failed:', err);
					delete form.data.image;
					return fail(500, {
						form,
						message:
							'Gagal mengunggah gambar. Silakan coba lagi atau gunakan gambar yang lebih kecil.'
					});
				}
			}

			const updatePayload: any = {
				...rest,
				startTime: startTimeDate,
				endTime: endTimeDate,
				capacity: rest.capacity ? Number(rest.capacity) : 0,
				type: rest.category as any
			};

			if (imageUrl) {
				updatePayload.imageUrl = imageUrl;
			}

			await db.update(event).set(updatePayload).where(eq(event.id, form.data.id));
		} catch (error) {
			console.error(error);
			delete form.data.image;
			return fail(500, { form, message: 'Gagal memperbarui kegiatan' });
		}

		throw redirect(303, '/admin/kegiatan');
	},

	delete: async ({ request }) => {
		// This action might differ from simple form bind if called from a button with formaction
		const formData = await request.formData();
		const id = formData.get('id');

		if (!id) {
			return fail(400, { message: 'ID required' });
		}

		const exitstingEvent = await db.query.event.findFirst({
			where: eq(event.id, Number(id))
		});

		if (!exitstingEvent) {
			return fail(404, { message: 'Kegiatan tidak ditemukan' });
		}

		try {
			if (exitstingEvent.imageUrl) {
				const publicId = getPublicIdFromUrl(exitstingEvent.imageUrl);

				if (publicId) await deleteImage(publicId);
			}
			await db.delete(event).where(eq(event.id, Number(id)));
		} catch (error) {
			console.error(error);
			return fail(500, { message: 'Gagal menghapus kegiatan' });
		}

		throw redirect(303, '/admin/kegiatan');
	}
};
