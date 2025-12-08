import {
	pgTable,
	serial,
	text,
	integer,
	timestamp,
	boolean,
	pgEnum,
	date,
	decimal,
	jsonb
} from 'drizzle-orm/pg-core';
import { email } from 'valibot';

// --- Enums ---
export const roleEnum = pgEnum('role', ['super_admin', 'admin', 'imam', 'bendahara', 'jamaah']);
export const transactionTypeEnum = pgEnum('transaction_type', ['income', 'expense']);
export const transactionCategoryEnum = pgEnum('transaction_category', [
	'infaq',
	'zakat',
	'wakaf',
	'operasional',
	'maintenance',
	'gaji',
	'kegiatan',
	'lainnya'
]);
export const eventTypeEnum = pgEnum('event_type', [
	'kajian',
	'ibadah',
	'sosial',
	'phbi',
	'rapat',
	'lainnya'
]);
export const eventStatusEnum = pgEnum('event_status', [
	'scheduled',
	'ongoing',
	'completed',
	'cancelled'
]);
export const assetConditionEnum = pgEnum('asset_condition', [
	'good',
	'maintenance',
	'damaged',
	'lost'
]);
export const donationStatusEnum = pgEnum('donation_status', ['pending', 'verified', 'rejected']);
export const announcementCategoryEnum = pgEnum('announcement_category', [
	'berita',
	'laporan',
	'pengumuman',
	'jadwal'
]);

export const otpTypeEnum = pgEnum('otp_type', ['email_verification', 'password_reset']);

/**
 * Roles for Dynamic RBAC
 */
export const roles = pgTable('roles', {
	id: serial('id').primaryKey(),
	name: text('name').notNull().unique(),
	description: text('description'),
	permissions: jsonb('permissions'), // List of allowed actions/routes
	isSystem: boolean('is_system').default(false).notNull(), // Prevents deletion of core roles
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

/**
 * Permissions for Dynamic RBAC
 */
export const permissions = pgTable('permissions', {
	id: serial('id').primaryKey(),
	slug: text('slug').notNull().unique(), // e.g., 'manage_users'
	name: text('name').notNull(), // e.g., 'Manage Users'
	description: text('description'),
	group: text('group').default('general').notNull(), // e.g., 'users', 'settings'
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

/**
 * System Configuration
 */
export const systemConfig = pgTable('system_config', {
	key: text('key').primaryKey(),
	value: text('value'), // Can be JSON stringified
	type: text('type').default('string').notNull(), // string, number, boolean, json
	group: text('group').default('general').notNull(), // general, security
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// --- Tables ---

/**
 * Users table extended with role and profile info
 */
export const user = pgTable('user', {
	id: text('id').primaryKey(), // Using text for ID (e.g., Lucia auth ID or UUID)
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	fullName: text('full_name'),
	about: text('about'),
	roleId: integer('role_id').references(() => roles.id),
	role: roleEnum('role').default('jamaah').notNull(), // Deprecated in favor of roleId
	phone: text('phone'),
	avatarUrl: text('avatar_url'),
	emailVerified: timestamp('email_verified'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
	deletedAt: timestamp('deleted_at')
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

export const otp = pgTable('otp', {
	id: serial('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	code: text('code').notNull(), // Hashed OTP
	type: otpTypeEnum('type').notNull(),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

/**
 * Mosque Profile (Single record usually)
 */
export const mosqueProfile = pgTable('mosque_profile', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	address: text('address').notNull(),
	phone: text('phone'),
	email: text('email'),
	website: text('website'),
	vision: text('vision'),
	mission: text('mission'),
	history: text('history'),
	imageUrl: text('image_url'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

/**
 * Financial Transactions
 */
export const financialTransaction = pgTable('financial_transaction', {
	id: serial('id').primaryKey(),
	type: transactionTypeEnum('type').notNull(),
	category: transactionCategoryEnum('category').notNull(),
	amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
	description: text('description').notNull(),
	date: date('date').defaultNow().notNull(),
	proofUrl: text('proof_url'),
	notes: text('notes'),
	recordedBy: text('recorded_by').references(() => user.id),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
	deletedAt: timestamp('deleted_at')
});

/**
 * Events / Kegiatan
 */
export const event = pgTable('event', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description'),
	type: eventTypeEnum('type').notNull(),
	status: eventStatusEnum('status').default('scheduled').notNull(),
	startTime: timestamp('start_time').notNull(),
	endTime: timestamp('end_time').notNull(),
	location: text('location'),
	speaker: text('speaker'),
	imageUrl: text('image_url'),
	capacity: integer('capacity'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
	deletedAt: timestamp('deleted_at')
});

/**
 * Members / Jamaah Data
 */
export const member = pgTable('member', {
	id: serial('id').primaryKey(),
	userId: text('user_id').references(() => user.id), // Optional link to system user
	fullName: text('full_name').notNull(),
	email: text('email').notNull(), // Add email column
	nik: text('nik').unique(),
	phone: text('phone'),
	address: text('address'),
	gender: text('gender').default('male'), // Add gender column
	imageUrl: text('image_url'),
	birthDate: date('birth_date'),
	joinDate: date('join_date').defaultNow(),
	status: text('status').default('active'), // active, inactive, moved, deceased
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
	deletedAt: timestamp('deleted_at')
});

export const attendanceStatusEnum = pgEnum('attendance_status', [
	'present',
	'permission',
	'absent'
]);

export const eventAttendance = pgTable('event_attendance', {
	id: serial('id').primaryKey(),
	eventId: integer('event_id')
		.references(() => event.id)
		.notNull(),
	memberId: integer('member_id').references(() => member.id), // Link to member if applicable
	name: text('name').notNull(), // Valid for guest or member
	status: attendanceStatusEnum('status').default('present').notNull(),
	notes: text('notes'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

/**
 * Event Registrations (Public/Guest)
 */
export const eventRegistration = pgTable('event_registration', {
	id: serial('id').primaryKey(),
	eventId: integer('event_id')
		.references(() => event.id)
		.notNull(),
	name: text('name').notNull(),
	email: text('email'),
	phone: text('phone').notNull(),
	notes: text('notes'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

/**
 * Inventory Items
 */
export const inventoryItem = pgTable('inventory_item', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	code: text('code').unique().notNull(),
	category: text('category').notNull(), // e.g., Elektronik, Furniture
	quantity: integer('quantity').default(0).notNull(),
	condition: assetConditionEnum('condition').default('good').notNull(),
	location: text('location'),
	purchaseDate: date('purchase_date'),
	price: decimal('price', { precision: 15, scale: 2 }),
	imageUrl: text('image_url'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
	deletedAt: timestamp('deleted_at')
});

/**
 * Donation Campaigns & Records
 */
export const donationCampaign = pgTable('donation_campaign', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description'),
	targetAmount: decimal('target_amount', { precision: 15, scale: 2 }),
	startDate: date('start_date').notNull(),
	endDate: date('end_date'),
	imageUrl: text('image_url'),
	active: boolean('active').default(true).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const donation = pgTable('donation', {
	id: serial('id').primaryKey(),
	campaignId: integer('campaign_id').references(() => donationCampaign.id),
	donorName: text('donor_name').default('Hamba Allah'),
	donorPhone: text('donor_phone'),
	amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
	paymentMethod: text('payment_method'), // transfer, qris, cash
	status: donationStatusEnum('status').default('pending').notNull(),
	proofUrl: text('proof_url'),
	verifiedBy: text('verified_by').references(() => user.id),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

/**
 * Announcements / Informasi
 */
export const announcement = pgTable('announcement', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	content: text('content').notNull(),
	category: announcementCategoryEnum('category').notNull(),
	authorId: text('author_id').references(() => user.id),
	isPublished: boolean('is_published').default(false).notNull(),
	publishedAt: timestamp('published_at'),
	imageUrl: text('image_url'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
	deletedAt: timestamp('deleted_at')
});

/**
 * Audit Log for tracking changes
 */
export const auditLog = pgTable('audit_log', {
	id: serial('id').primaryKey(),
	tableName: text('table_name').notNull(),
	recordId: text('record_id').notNull(), // Stored as text to handle both int and string IDs
	action: text('action').notNull(), // CREATE, UPDATE, DELETE, RESTORE
	userId: text('user_id').references(() => user.id),
	oldValues: text('old_values'), // JSON string
	newValues: text('new_values'), // JSON string
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

/**
 * Protected Routes for Dynamic RBAC
 */
export const protectedRoute = pgTable('protected_route', {
	id: serial('id').primaryKey(),
	prefix: text('prefix').notNull().unique(), // e.g., '/admin/users'
	roles: text('roles').array().notNull(), // e.g., ['super_admin']
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});
