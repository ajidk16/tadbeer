import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { logAudit } from '$lib/server/audit';

export const load = async () => {
	const configs = await db.select().from(table.systemConfig);

	const configMap = configs.reduce(
		(acc, curr) => {
			acc[curr.key] = curr.value;
			return acc;
		},
		{} as Record<string, string>
	);

	return {
		config: {
			maintenanceMode: configMap.maintenance_mode === 'true',
			registrationOpen: configMap.registration_open === 'true',
			sessionTimeout: Number(configMap.session_timeout) || 30,
			maxUploadSize: Number(configMap.max_upload_size) || 5,
			debugMode: configMap.debug_mode === 'true'
		}
	};
};

export const actions = {
	update: async ({ request }) => {
		const formData = await request.formData();
		const maintenanceMode = formData.get('maintenanceMode') === 'on';
		const registrationOpen = formData.get('registrationOpen') === 'on';
		const sessionTimeout = formData.get('sessionTimeout');
		const maxUploadSize = formData.get('maxUploadSize');
		const debugMode = formData.get('debugMode') === 'on';

		const updates = [
			{ key: 'maintenance_mode', value: String(maintenanceMode) },
			{ key: 'registration_open', value: String(registrationOpen) },
			{ key: 'session_timeout', value: String(sessionTimeout) },
			{ key: 'max_upload_size', value: String(maxUploadSize) },
			{ key: 'debug_mode', value: String(debugMode) }
		];

		try {
			for (const update of updates) {
				await db
					.insert(table.systemConfig)
					.values({
						key: update.key,
						value: update.value,
						type: 'string', // Simplified for now
						group: 'general'
					})
					.onConflictDoUpdate({
						target: table.systemConfig.key,
						set: { value: update.value, updatedAt: new Date() }
					});
			}

			await logAudit(request.headers.get('x-user-id'), 'UPDATE', 'systemConfig', 'general', {
				newValues: { maintenanceMode, registrationOpen, sessionTimeout, maxUploadSize, debugMode }
			});

			return { success: true, message: 'Configuration updated successfully' };
		} catch (error) {
			console.error('Failed to update config:', error);
			return { success: false, message: 'Failed to update configuration' };
		}
	}
};
