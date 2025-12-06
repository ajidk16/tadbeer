import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { roleSchema } from '$lib/schemas';
import { eq, desc, sql } from 'drizzle-orm';
import { logAudit } from '$lib/server/audit';

export const load = async () => {
	const roles = await db
		.select({
			id: table.roles.id,
			name: table.roles.name,
			description: table.roles.description,
			permissions: table.roles.permissions,
			users: table.user.fullName
		})
		.from(table.roles)
		.innerJoin(table.user, eq(table.roles.id, table.user.roleId))
		.orderBy(table.roles.id);

	const permissions = await db
		.select()
		.from(table.permissions)
		.orderBy(table.permissions.group, table.permissions.name);

	const form = await superValidate(valibot(roleSchema));

	return { roles, form, permissions };
};

export const actions = {
	create: async ({ request }) => {
		const form = await superValidate(request, valibot(roleSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { name, description, permissions } = form.data;

		try {
			const [newRole] = await db
				.insert(table.roles)
				.values({
					name,
					description,
					permissions: permissions || []
				})
				.returning();

			await logAudit(request.headers.get('x-user-id'), 'CREATE', 'roles', String(newRole.id), {
				newValues: newRole
			});
		} catch (error) {
			console.error('Create role failed:', error);
			return fail(500, { form, message: 'Failed to create role' });
		}

		return { form, message: 'Role created successfully' };
	},

	update: async ({ request }) => {
		const form = await superValidate(request, valibot(roleSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { id, name, description, permissions } = form.data;

		if (!id) {
			return fail(400, { form, message: 'Role ID required' });
		}

		try {
			await db
				.update(table.roles)
				.set({ name, description, permissions: permissions || [] })
				.where(eq(table.roles.id, id));

			await logAudit(request.headers.get('x-user-id'), 'UPDATE', 'roles', String(id), {
				newValues: { name, description, permissions }
			});
		} catch (error) {
			console.error('Update role failed:', error);
			return fail(500, { form, message: 'Failed to update role' });
		}

		return { form, message: 'Role updated successfully' };
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));

		if (!id) {
			return fail(400, { message: 'Role ID required' });
		}

		try {
			// Check if role is system role
			const [role] = await db.select().from(table.roles).where(eq(table.roles.id, id));
			if (role?.isSystem) {
				return fail(400, { message: 'Cannot delete system role' });
			}

			await db.delete(table.roles).where(eq(table.roles.id, id));

			await logAudit(request.headers.get('x-user-id'), 'DELETE', 'roles', String(id));
		} catch (error) {
			console.error('Delete role failed:', error);
			return fail(500, { message: 'Failed to delete role' });
		}

		return { success: true, message: 'Role deleted successfully' };
	},

	updatePermissions: async ({ request }) => {
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		const permissions = formData.getAll('permissions') as string[];

		if (!id) {
			return fail(400, { message: 'Role ID required' });
		}

		try {
			await db.update(table.roles).set({ permissions }).where(eq(table.roles.id, id));

			await logAudit(request.headers.get('x-user-id'), 'UPDATE', 'roles', String(id), {
				newValues: { permissions }
			});
		} catch (error) {
			console.error('Update permissions failed:', error);
			return fail(500, { message: 'Failed to update permissions' });
		}

		return { success: true, message: 'Permissions updated successfully' };
	}
};
