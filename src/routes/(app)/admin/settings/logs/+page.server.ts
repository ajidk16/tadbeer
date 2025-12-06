import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { desc, eq, and, like, sql } from 'drizzle-orm';

export const load = async ({ url }) => {
	const page = Number(url.searchParams.get('page')) || 1;
	const pageSize = 20;
	const action = url.searchParams.get('action');
	const search = url.searchParams.get('search');

	const conditions = [];
	if (action) conditions.push(eq(table.auditLog.action, action));
	if (search) conditions.push(like(table.user.username, `%${search}%`));

	const logs = await db
		.select({
			id: table.auditLog.id,
			action: table.auditLog.action,
			tableName: table.auditLog.tableName,
			recordId: table.auditLog.recordId,
			createdAt: table.auditLog.createdAt,
			user: {
				username: table.user.username,
				fullName: table.user.fullName
			},
			details: {
				oldValues: table.auditLog.oldValues,
				newValues: table.auditLog.newValues
			}
		})
		.from(table.auditLog)
		.leftJoin(table.user, eq(table.auditLog.userId, table.user.id))
		.where(and(...conditions))
		.orderBy(desc(table.auditLog.createdAt))
		.limit(pageSize)
		.offset((page - 1) * pageSize);

	const [countResult] = await db
		.select({ count: sql<number>`count(*)` })
		.from(table.auditLog)
		.leftJoin(table.user, eq(table.auditLog.userId, table.user.id))
		.where(and(...conditions));

	return {
		logs,
		pagination: {
			page,
			pageSize,
			total: Number(countResult.count),
			totalPages: Math.ceil(Number(countResult.count) / pageSize)
		}
	};
};
