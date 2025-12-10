import * as v from 'valibot';

export const registerSchema = v.pipe(
	v.object({
		name: v.pipe(v.string(), v.minLength(3, 'Name must be at least 3 characters')),
		email: v.pipe(v.string(), v.email('Invalid email address')),
		password: v.pipe(v.string(), v.minLength(6, 'Password must be at least 6 characters')),
		confirmPassword: v.string()
	}),
	v.forward(
		v.check((input) => input.password === input.confirmPassword, "Passwords don't match"),
		['confirmPassword']
	)
);

export const loginSchema = v.object({
	email: v.pipe(v.string(), v.email('Invalid email address')),
	password: v.pipe(v.string(), v.minLength(1, 'Password is required'))
});

export const verifySchema = v.object({
	email: v.pipe(v.string(), v.email()),
	otp: v.pipe(v.string(), v.length(6, 'OTP must be 6 digits'))
});

export const forgotPasswordSchema = v.object({
	email: v.pipe(v.string(), v.email('Invalid email address'))
});

export const changePasswordSchema = v.pipe(
	v.object({
		email: v.pipe(v.string(), v.email()),
		otp: v.pipe(v.string(), v.length(6, 'OTP must be 6 digits')),
		newPassword: v.pipe(v.string(), v.minLength(6, 'Password must be at least 6 characters')),
		confirmPassword: v.string()
	}),
	v.forward(
		v.check((input) => input.newPassword === input.confirmPassword, "Passwords don't match"),
		['confirmPassword']
	)
);

export type RegisterSchema = typeof registerSchema;
export type LoginSchema = typeof loginSchema;
export type VerifySchema = typeof verifySchema;
export type ForgotPasswordSchema = typeof forgotPasswordSchema;
export type ChangePasswordSchema = typeof changePasswordSchema;

export const mosqueProfileSchema = v.object({
	name: v.pipe(v.string(), v.minLength(3, 'Name is required')),
	address: v.pipe(v.string(), v.minLength(5, 'Address is required')),
	phone: v.optional(v.string()),
	email: v.optional(v.pipe(v.string(), v.email())),
	website: v.optional(v.string()),
	vision: v.optional(v.string()),
	mission: v.optional(v.string()),
	history: v.optional(v.string()),
	imageUrl: v.optional(v.string())
});

export type MosqueProfileSchema = typeof mosqueProfileSchema;

export const inviteUserSchema = v.object({
	name: v.pipe(v.string(), v.minLength(3, 'Name is required')),
	email: v.pipe(v.string(), v.email('Invalid email address')),
	roleId: v.number('Role is required')
});

export const updateUserRoleSchema = v.object({
	userId: v.string(),
	roleId: v.number('Role is required')
});

export type InviteUserSchema = typeof inviteUserSchema;
export type UpdateUserRoleSchema = typeof updateUserRoleSchema;

export const roleSchema = v.object({
	id: v.optional(v.number()),
	name: v.pipe(v.string(), v.minLength(3, 'Name must be at least 3 characters')),
	description: v.optional(v.string()),
	permissions: v.optional(v.array(v.string()))
});

export type RoleSchema = typeof roleSchema;

export const permissionSchema = v.object({
	id: v.optional(v.number()),
	slug: v.pipe(v.string(), v.minLength(3, 'Slug must be at least 3 characters')),
	name: v.pipe(v.string(), v.minLength(3, 'Name must be at least 3 characters')),
	description: v.optional(v.string()),
	group: v.pipe(v.string(), v.minLength(1, 'Group is required'))
});

export type PermissionSchema = typeof permissionSchema;

export const profileSchema = v.object({
	fullName: v.pipe(v.string(), v.minLength(3, 'Full name must be at least 3 characters')),
	phone: v.optional(v.string()),
	about: v.optional(v.string())
});

export type ProfileSchema = typeof profileSchema;

export const securitySchema = v.object({
	currentPassword: v.pipe(v.string(), v.minLength(1, 'Current password is required')),
	newPassword: v.pipe(v.string(), v.minLength(6, 'Password must be at least 6 characters')),
	confirmPassword: v.pipe(v.string(), v.minLength(1, 'Please confirm your password'))
});

export const transactionSchema = v.object({
	id: v.optional(v.number()),
	date: v.pipe(v.string(), v.minLength(1, 'Date is required')),
	category: v.pipe(v.string(), v.minLength(1, 'Category is required')),
	amountRaw: v.pipe(
		v.number('Amount must be a number'),
		v.minValue(1, 'Amount must be greater than 0')
	),

	description: v.pipe(v.string(), v.minLength(3, 'Description must be at least 3 characters')),
	notes: v.optional(v.string()),
	proof: v.optional(v.any()) // File object processing is handled separately
});

export type TransactionSchema = typeof transactionSchema;

export const eventSchema = v.object({
	id: v.optional(v.number()),
	title: v.pipe(v.string(), v.minLength(3, 'Title is required')),
	category: v.pipe(v.string(), v.minLength(1, 'Category is required')), // Maps to 'type' in DB
	date: v.pipe(v.string(), v.minLength(1, 'Date is required')),
	time: v.pipe(v.string(), v.minLength(1, 'Start time is required')),
	endTime: v.optional(v.string()),
	location: v.optional(v.string()),
	description: v.optional(v.string()),
	capacity: v.optional(v.string()), // Form input is text/number, handle conversion
	speaker: v.optional(v.string())
});

export type EventSchema = typeof eventSchema;

export const memberSchema = v.object({
	id: v.optional(v.number()),
	name: v.pipe(v.string(), v.minLength(3, 'Nama harus diisi minimal 3 karakter')),
	nik: v.optional(v.pipe(v.string(), v.maxLength(16, 'NIK maksimal 16 karakter'))),
	gender: v.pipe(v.string(), v.minLength(1, 'Pilih jenis kelamin')),
	birthDate: v.optional(v.string()), // Accept string from date input
	phone: v.optional(v.string()),
	email: v.optional(v.pipe(v.string(), v.email('Email tidak valid'))),
	address: v.optional(v.string()),
	status: v.optional(v.string())
});

export type MemberSchema = typeof memberSchema;

export const campaignSchema = v.object({
	id: v.optional(v.number()),
	title: v.pipe(v.string(), v.minLength(5, 'Nama program minimal 5 karakter')),
	target: v.pipe(
		// v.number('Target dana harus berupa angka'),
		// v.minValue(10000, 'Target dana minimal Rp 10.000')
		v.number('Amount must be a number'),
		v.minValue(1, 'Amount must be greater than 0')
	),
	deadline: v.pipe(v.string(), v.minLength(1, 'Tentukan batas waktu')),
	description: v.optional(v.string())
});

export type CampaignSchema = typeof campaignSchema;

export const deleteCampaignSchema = v.object({
	id: v.pipe(v.number('ID program harus berupa angka'))
});

export type DeleteCampaignSchema = typeof deleteCampaignSchema;

export const inventorySchema = v.object({
	id: v.optional(v.number()),
	name: v.pipe(v.string(), v.minLength(3, 'Nama aset wajib diisi minimal 3 karakter')),
	code: v.optional(v.string()),
	category: v.pipe(v.string(), v.minLength(1, 'Kategori wajib dipilih')),
	quantity: v.pipe(v.number('Jumlah harus angka'), v.minValue(1, 'Minimal 1unit')),
	condition: v.pipe(v.string(), v.minLength(1, 'Kondisi wajib dipilih')),
	location: v.optional(v.string()),
	purchaseDate: v.optional(v.string()),
	price: v.optional(v.number()),
	description: v.optional(v.string())
});

export type InventorySchema = typeof inventorySchema;

export const lendingSchema = v.object({
	id: v.optional(v.number()),
	assetId: v.pipe(v.number('Pilih aset'), v.minValue(1, 'Pilih aset yang valid')),
	borrowerName: v.pipe(v.string(), v.minLength(3, 'Nama peminjam wajib diisi')),
	borrowerContact: v.optional(v.string()),
	borrowDate: v.optional(v.string()), // form input date
	returnDate: v.optional(v.string()), // form input date (planning)
	notes: v.optional(v.string())
});

export type LendingSchema = typeof lendingSchema;

export const publicBorrowSchema = v.object({
	assetId: v.pipe(v.number('Pilih aset'), v.minValue(1, 'Pilih aset yang valid')),
	borrowerName: v.pipe(v.string(), v.minLength(3, 'Nama peminjam wajib diisi')),
	borrowerContact: v.pipe(v.string(), v.minLength(10, 'Nomor HP minimal 10 digit')),
	borrowDate: v.pipe(v.string(), v.minLength(1, 'Tanggal pinjam wajib diisi')),
	returnDate: v.pipe(v.string(), v.minLength(1, 'Tanggal kembali wajib diisi')),
	notes: v.optional(v.string())
});

export type PublicBorrowSchema = typeof publicBorrowSchema;

export const maintenanceSchema = v.object({
	id: v.optional(v.number()),
	assetId: v.pipe(v.number('Pilih aset'), v.minValue(1, 'Pilih aset yang valid')),
	maintenanceDate: v.pipe(v.string(), v.minLength(1, 'Tanggal wajib diisi')),
	description: v.pipe(v.string(), v.minLength(3, 'Deskripsi wajib diisi')),
	cost: v.optional(v.number()),
	performer: v.optional(v.string()),
	status: v.optional(v.string()), // scheduled, in_progress, completed, cancelled
	notes: v.optional(v.string())
});

export type MaintenanceSchema = typeof maintenanceSchema;

export const announcementSchema = v.object({
	id: v.optional(v.number()),
	title: v.pipe(v.string(), v.minLength(3, 'Judul wajib diisi minimal 3 karakter')),
	content: v.pipe(v.string(), v.minLength(10, 'Konten wajib diisi minimal 10 karakter')),
	type: v.pipe(v.string(), v.minLength(1, 'Tipe wajib dipilih')), // info, urgent
	imageUrl: v.optional(v.string())
});

export type AnnouncementSchema = typeof announcementSchema;

// ... existing code ...
export const khutbahSchema = v.object({
	id: v.optional(v.number()),
	date: v.pipe(v.string(), v.minLength(1, 'Tanggal wajib diisi')),
	khatib: v.pipe(v.string(), v.minLength(3, 'Nama Khatib wajib diisi')),
	imam: v.pipe(v.string(), v.minLength(3, 'Nama Imam wajib diisi')),
	muadzin: v.optional(v.string()),
	theme: v.optional(v.string())
});

export type KhutbahSchema = typeof khutbahSchema;

export const notificationSettingsSchema = v.object({
	activityUpdates: v.boolean(),
	marketingTips: v.boolean(),
	realtimeAlerts: v.boolean(),
	securityAlerts: v.boolean()
});

export type NotificationSettingsSchema = typeof notificationSettingsSchema;

export const quickDonationSchema = v.object({
	campaignId: v.optional(v.number()),
	amount: v.pipe(
		v.number('Nominal harus berupa angka'),
		v.minValue(10000, 'Minimal donasi Rp 10.000')
	),
	donorName: v.optional(v.string()),
	donorPhone: v.optional(v.string()),
	paymentMethod: v.pipe(v.string(), v.minLength(1, 'Pilih metode pembayaran'))
});

export type QuickDonationSchema = typeof quickDonationSchema;

export const donationCommentSchema = v.object({
	campaignId: v.number('Campaign ID harus berupa angka'),
	name: v.pipe(v.string(), v.minLength(2, 'Nama minimal 2 karakter')),
	message: v.pipe(v.string(), v.minLength(5, 'Pesan minimal 5 karakter'))
});

export type DonationCommentSchema = typeof donationCommentSchema;
