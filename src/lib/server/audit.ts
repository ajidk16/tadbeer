/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'RESTORE';

export async function logAudit(
	userId: string | null,
	action: AuditAction,
	tableName: string,
	recordId: string,
	details?: {
		oldValues?: any;
		newValues?: any;
		ipAddress?: string;
		userAgent?: string;
	}
) {
	try {
		await db.insert(table.auditLog).values({
			userId,
			action,
			tableName,
			recordId,
			oldValues: details?.oldValues ? JSON.stringify(details.oldValues) : null,
			newValues: details?.newValues ? JSON.stringify(details.newValues) : null,
			ipAddress: details?.ipAddress,
			userAgent: details?.userAgent
		});
	} catch (error) {
		console.error('Failed to create audit log:', error);
		// Don't throw error to prevent blocking the main action
	}
}
