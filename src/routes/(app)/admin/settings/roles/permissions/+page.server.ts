import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { permissionSchema } from '$lib/schemas';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq, like, or, desc, sql, and } from 'drizzle-orm';
import { logAudit } from '$lib/server/audit';

export const load = async ({ url }) => {
	const page = Number(url.searchParams.get('page')) || 1;
	const pageSize = 10;
	const search = url.searchParams.get('search') || '';
	const group = url.searchParams.get('group') || '';

	const conditions = [];
	if (search) {
		conditions.push(
			or(
				like(table.permissions.name, `%${search}%`),
				like(table.permissions.slug, `%${search}%`),
				like(table.permissions.description, `%${search}%`)
			)
		);
	}
	if (group) {
		conditions.push(eq(table.permissions.group, group));
	}

	const permissions = await db
		.select()
		.from(table.permissions)
		.where(and(...conditions))
		.orderBy(table.permissions.group, table.permissions.name)
		.limit(pageSize)
		.offset((page - 1) * pageSize);

	const [countResult] = await db
		.select({ count: sql<number>`count(*)` })
		.from(table.permissions)
		.where(and(...conditions));

	const form = await superValidate(valibot(permissionSchema));

	return {
		permissions,
		pagination: {
			page,
			pageSize,
			total: Number(countResult.count),
			totalPages: Math.ceil(Number(countResult.count) / pageSize)
		},
		form
	};
};

export const actions = {
	create: async ({ request }) => {
		const form = await superValidate(request, valibot(permissionSchema));
		if (!form.valid) return fail(400, { form });

		try {
			const [newPermission] = await db
				.insert(table.permissions)
				.values({
					slug: form.data.slug,
					name: form.data.name,
					description: form.data.description,
					group: form.data.group
				})
				.returning();

			await logAudit(
				request.headers.get('x-user-id'),
				'CREATE',
				'permissions',
				String(newPermission.id),
				{
					newValues: form.data
				}
			);

			return { form, message: 'Permission created successfully' };
		} catch (error) {
			console.error('Create permission failed:', error);
			return fail(500, { form, message: 'Failed to create permission' });
		}
	},

	update: async ({ request }) => {
		const form = await superValidate(request, valibot(permissionSchema));
		if (!form.valid) return fail(400, { form });

		if (!form.data.id) return fail(400, { form, message: 'Permission ID is required' });

		try {
			await db
				.update(table.permissions)
				.set({
					slug: form.data.slug,
					name: form.data.name,
					description: form.data.description,
					group: form.data.group,
					updatedAt: new Date()
				})
				.where(eq(table.permissions.id, form.data.id));

			await logAudit(
				request.headers.get('x-user-id'),
				'UPDATE',
				'permissions',
				String(form.data.id),
				{
					newValues: form.data
				}
			);

			return { form, message: 'Permission updated successfully' };
		} catch (error) {
			console.error('Update permission failed:', error);
			return fail(500, { form, message: 'Failed to update permission' });
		}
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));

		if (!id) return fail(400, { message: 'Invalid permission ID' });

		try {
			await db.delete(table.permissions).where(eq(table.permissions.id, id));

			await logAudit(request.headers.get('x-user-id'), 'DELETE', 'permissions', String(id), {
				oldValues: {
					id
				}
			});

			return { success: true, message: 'Permission deleted successfully' };
		} catch (error) {
			console.error('Delete permission failed:', error);
			return fail(500, { message: 'Failed to delete permission' });
		}
	}
};
