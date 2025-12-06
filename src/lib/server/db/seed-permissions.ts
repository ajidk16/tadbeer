import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as table from './schema';

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL is not set');
}

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

const permissions = [
	{
		slug: 'manage_users',
		name: 'Manage Users',
		description: 'Create, edit, and delete users',
		group: 'users'
	},
	{
		slug: 'manage_roles',
		name: 'Manage Roles',
		description: 'Create and edit roles and permissions',
		group: 'settings'
	},
	{
		slug: 'manage_settings',
		name: 'Manage Settings',
		description: 'Access system configuration',
		group: 'settings'
	},
	{
		slug: 'create_content',
		name: 'Create Content',
		description: 'Create new content (articles, events)',
		group: 'content'
	},
	{
		slug: 'edit_content',
		name: 'Edit Content',
		description: 'Edit existing content',
		group: 'content'
	},
	{
		slug: 'delete_content',
		name: 'Delete Content',
		description: 'Delete content',
		group: 'content'
	},
	{
		slug: 'view_reports',
		name: 'View Reports',
		description: 'Access financial and activity reports',
		group: 'reports'
	},
	{
		slug: 'export_data',
		name: 'Export Data',
		description: 'Export system data to CSV/PDF',
		group: 'reports'
	}
];

async function seed() {
	console.log('Seeding permissions...');
	for (const perm of permissions) {
		await db.insert(table.permissions).values(perm).onConflictDoUpdate({
			target: table.permissions.slug,
			set: perm
		});
	}
	console.log('Permissions seeded successfully.');
	process.exit(0);
}

seed().catch((err) => {
	console.error('Seeding failed:', err);
	process.exit(1);
});
