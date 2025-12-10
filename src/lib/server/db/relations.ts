import { relations } from 'drizzle-orm';
import {
	user,
	session,
	financialTransaction,
	event,
	member,
	donation,
	donationCampaign,
	donationComment,
	announcement,
	auditLog,
	roles,
	inventoryItem,
	assetLending,
	assetMaintenance,
	notification,
	userSettings
} from './schema';

export const userRelations = relations(user, ({ many, one }) => ({
	sessions: many(session),
	recordedTransactions: many(financialTransaction),
	verifiedDonations: many(donation),
	authoredAnnouncements: many(announcement),
	auditLogs: many(auditLog),
	notifications: many(notification),
	settings: one(userSettings, {
		fields: [user.id],
		references: [userSettings.userId]
	}),
	role: one(roles, {
		fields: [user.roleId],
		references: [roles.id]
	})
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	})
}));

export const financialTransactionRelations = relations(financialTransaction, ({ one }) => ({
	recorder: one(user, {
		fields: [financialTransaction.recordedBy],
		references: [user.id]
	})
}));

export const memberRelations = relations(member, ({ one }) => ({
	user: one(user, {
		fields: [member.userId],
		references: [user.id]
	})
}));

export const donationCampaignRelations = relations(donationCampaign, ({ many }) => ({
	donations: many(donation),
	comments: many(donationComment)
}));

export const donationRelations = relations(donation, ({ one }) => ({
	campaign: one(donationCampaign, {
		fields: [donation.campaignId],
		references: [donationCampaign.id]
	}),
	verifier: one(user, {
		fields: [donation.verifiedBy],
		references: [user.id]
	})
}));

export const donationCommentRelations = relations(donationComment, ({ one }) => ({
	campaign: one(donationCampaign, {
		fields: [donationComment.campaignId],
		references: [donationCampaign.id]
	})
}));

export const announcementRelations = relations(announcement, ({ one }) => ({
	author: one(user, {
		fields: [announcement.authorId],
		references: [user.id]
	})
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
	user: one(user, {
		fields: [auditLog.userId],
		references: [user.id]
	})
}));

export const inventoryItemRelations = relations(inventoryItem, ({ many }) => ({
	lendings: many(assetLending),
	maintenanceLogs: many(assetMaintenance)
}));

export const assetLendingRelations = relations(assetLending, ({ one }) => ({
	asset: one(inventoryItem, {
		fields: [assetLending.assetId],
		references: [inventoryItem.id]
	}),
	recordedBy: one(user, {
		fields: [assetLending.recordedBy],
		references: [user.id]
	})
}));

export const assetMaintenanceRelations = relations(assetMaintenance, ({ one }) => ({
	asset: one(inventoryItem, {
		fields: [assetMaintenance.assetId],
		references: [inventoryItem.id]
	})
}));

export const notificationRelations = relations(notification, ({ one }) => ({
	user: one(user, {
		fields: [notification.userId],
		references: [user.id]
	})
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
	user: one(user, {
		fields: [userSettings.userId],
		references: [user.id]
	})
}));
