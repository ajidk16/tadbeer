# Arsitektur Sistem Manajemen Masjid

Sistem manajemen masjid berbasis SvelteKit yang memanfaatkan stack teknologi existing (Drizzle ORM, Custom Auth, DaisyUI v5, Paraglide i18n) dengan arsitektur modular, role-based access control, dan optimasi performa.

---

## 1. UI/UX Plan (DaisyUI v5)

### Design System
- Theme custom islami dengan warna hijau/emas (`primary: emerald`, `accent: amber`)
- Dark mode support via DaisyUI theme switcher
- Responsive breakpoints: mobile-first (sm → md → lg → xl)

### Component Patterns

| Element | Implementation |
|---------|----------------|
| Navigation | `drawer` (mobile) + `navbar` (desktop) dengan avatar dropdown |
| Forms | DaisyUI `input`, `select`, `textarea` dengan validasi inline |
| Feedback | `toast` component untuk success/error, `modal` untuk konfirmasi |
| Animations | Tailwind `transition-all duration-300`, `animate-pulse` untuk loading |
| Tables | `table` dengan pagination, sorting, dan search |
| Cards | `card` dengan `card-actions` untuk modul dashboard |

### Key Screens
- Dashboard dengan statistik cards dan quick actions
- Kalender kegiatan dengan grid/list view toggle
- Form donasi dengan stepper progress
- Laporan keuangan dengan charts (via Chart.js/ApexCharts)

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  SvelteKit + DaisyUI + Paraglide (SSR + Client Hydration)   │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                     BACKEND (SvelteKit)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Form Actions│  │ API Routes  │  │ Server Load Functions│  │
│  │ (+page.server)│ │ (+server.ts)│  │ (data fetching)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                          │                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Middleware Layer (hooks.server.ts)          ││
│  │  Auth Guard → Role Check → Rate Limit → Logging         ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      DATA LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Drizzle ORM  │  │ Redis/KV     │  │ File Storage │       │
│  │ (PostgreSQL) │  │ (Cache)      │  │ (S3/Cloudflare)│     │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Modul Breakdown

| Modul | Fungsi Utama | Routes |
|-------|--------------|--------|
| **Auth** | Login, logout, register, password reset | `/auth/*` |
| **Dashboard** | Overview statistik, quick actions, notifikasi | `/dashboard` |
| **Keuangan** | Input pemasukan/pengeluaran, laporan, export PDF | `/keuangan/*` |
| **Kegiatan** | CRUD event, kalender, reminder, absensi | `/kegiatan/*` |
| **Jamaah** | Database anggota, import/export, membership | `/jamaah/*` |
| **Inventaris** | Aset masjid, peminjaman, maintenance log | `/inventaris/*` |
| **Pengumuman** | Broadcast info, jadwal sholat, khutbah | `/pengumuman/*` |
| **Donasi** | Form donasi online, tracking, receipt | `/donasi/*` |
| **Laporan** | Generate laporan, export Excel/PDF | `/laporan/*` |
| **Settings** | Profil masjid, user management, konfigurasi | `/settings/*` |

---

## 4. Auth Flow

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────┐
│  Login  │────▶│ Validate    │────▶│ Create      │────▶│ Set     │
│  Form   │     │ Credentials │     │ Session     │     │ Cookie  │
└─────────┘     └─────────────┘     └─────────────┘     └─────────┘
                      │                    │
                      ▼                    ▼
               Argon2 verify        Store in DB
               (existing auth.ts)   (30-day expiry)
```

### Middleware Chain di `hooks.server.ts`
1. `i18n()` → Detect locale
2. `validateSession()` → Populate `locals.user` & `locals.session`
3. `checkRole()` → Verify permission untuk protected routes
4. `rateLimit()` → Prevent brute force (optional dengan Upstash)

### Protected Route Pattern
```typescript
// +page.server.ts
export const load = async ({ locals }) => {
  if (!locals.user) redirect(302, '/auth/login');
  if (!hasPermission(locals.user.role, 'module:read')) error(403);
  // ... fetch data
};
```

---

## 5. Role & Permission Flow

### Roles

| Role | Deskripsi |
|------|-----------|
| `super_admin` | Full access, manage admins |
| `admin` | Manage semua modul kecuali settings admin |
| `imam` | Manage kegiatan, pengumuman, jadwal |
| `bendahara` | Manage keuangan, donasi, laporan |
| `jamaah` | View only, submit donasi, daftar kegiatan |

### Permission Matrix

| Module | super_admin | admin | imam | bendahara | jamaah |
|--------|:-----------:|:-----:|:----:|:---------:|:------:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ (limited) |
| Keuangan | ✅ | ✅ | ❌ | ✅ | ❌ |
| Kegiatan | ✅ | ✅ | ✅ | ❌ | 👁️ |
| Jamaah | ✅ | ✅ | 👁️ | ❌ | ❌ |
| Inventaris | ✅ | ✅ | ✅ | ❌ | ❌ |
| Pengumuman | ✅ | ✅ | ✅ | ❌ | 👁️ |
| Donasi | ✅ | ✅ | ❌ | ✅ | ✅ (submit) |
| Settings | ✅ | ✅ (partial) | ❌ | ❌ | ❌ |

✅ = Full CRUD, 👁️ = Read only, ❌ = No access

### Implementation
- Tambah field `role` di tabel `user`
- Buat tabel `permission` untuk granular control (opsional)
- Helper function `hasPermission(role, action)` di `$lib/server/auth.ts`

---

## 6. Database Schema

```sql
-- Extend existing user table
user (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT UNIQUE,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'jamaah', -- super_admin, admin, imam, bendahara, jamaah
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
)

-- Existing session table (no changes)
session (...)

-- Profil Masjid
mosque_profile (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  settings JSONB -- jadwal sholat config, dll
)

-- Keuangan
financial_transaction (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- income, expense
  category TEXT NOT NULL, -- zakat, infaq, sadaqah, operasional, dll
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL,
  receipt_url TEXT,
  created_by TEXT REFERENCES user(id),
  created_at TIMESTAMP DEFAULT NOW()
)

financial_category (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- income, expense
  is_active BOOLEAN DEFAULT true
)

-- Kegiatan
event (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT, -- pengajian, rapat, gotong_royong, dll
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  location TEXT,
  max_participants INTEGER,
  is_public BOOLEAN DEFAULT true,
  created_by TEXT REFERENCES user(id),
  created_at TIMESTAMP DEFAULT NOW()
)

event_participant (
  id TEXT PRIMARY KEY,
  event_id TEXT REFERENCES event(id),
  user_id TEXT REFERENCES user(id),
  status TEXT DEFAULT 'registered', -- registered, attended, absent
  registered_at TIMESTAMP DEFAULT NOW()
)

-- Jamaah/Member
member (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES user(id), -- nullable untuk non-registered
  full_name TEXT NOT NULL,
  nik TEXT UNIQUE,
  birth_date DATE,
  gender TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  membership_type TEXT, -- tetap, pendatang
  joined_date DATE,
  is_active BOOLEAN DEFAULT true
)

-- Inventaris
inventory_item (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  quantity INTEGER DEFAULT 1,
  condition TEXT, -- baik, rusak_ringan, rusak_berat
  location TEXT,
  acquisition_date DATE,
  acquisition_value DECIMAL(15,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)

inventory_loan (
  id TEXT PRIMARY KEY,
  item_id TEXT REFERENCES inventory_item(id),
  borrower_name TEXT NOT NULL,
  borrower_phone TEXT,
  loan_date DATE NOT NULL,
  return_date DATE,
  actual_return_date DATE,
  status TEXT DEFAULT 'borrowed', -- borrowed, returned
  notes TEXT
)

-- Donasi Online
donation (
  id TEXT PRIMARY KEY,
  donor_name TEXT NOT NULL,
  donor_email TEXT,
  donor_phone TEXT,
  amount DECIMAL(15,2) NOT NULL,
  category TEXT, -- zakat, infaq, wakaf, dll
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending', -- pending, paid, failed
  transaction_id TEXT, -- from payment gateway
  message TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Pengumuman
announcement (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT, -- umum, urgent, jadwal
  publish_date TIMESTAMP,
  expire_date TIMESTAMP,
  is_published BOOLEAN DEFAULT false,
  created_by TEXT REFERENCES user(id),
  created_at TIMESTAMP DEFAULT NOW()
)

-- Audit Log (untuk tracking perubahan)
audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES user(id),
  action TEXT NOT NULL, -- create, update, delete
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)
```

---

## 7. Caching & Performance Optimization

| Strategy | Implementation | Use Case |
|----------|----------------|----------|
| **SSR Caching** | `setHeaders({ 'cache-control': 'max-age=60' })` | Public pages (jadwal, pengumuman) |
| **Data Caching** | Redis/Upstash KV | Dashboard stats, aggregate queries |
| **Static Assets** | Immutable headers + CDN | Images, PDF receipts |
| **Query Optimization** | Drizzle indexes + pagination | List views dengan banyak data |
| **Lazy Loading** | Dynamic imports | Chart libraries, PDF generators |
| **Image Optimization** | `@sveltejs/enhanced-img` atau Cloudflare Images | Foto kegiatan, avatar |

### Database Indexes
```sql
CREATE INDEX idx_transaction_date ON financial_transaction(transaction_date);
CREATE INDEX idx_transaction_type ON financial_transaction(type);
CREATE INDEX idx_event_date ON event(start_date);
CREATE INDEX idx_member_name ON member(full_name);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
```

---

## 8. Security Checklist

| Area | Implementation |
|------|----------------|
| **Authentication** | ✅ Argon2 password hashing (existing) |
| **Session** | ✅ SHA256 token hashing, 30-day expiry (existing) |
| **CSRF** | ✅ SvelteKit form actions (built-in) |
| **XSS** | ✅ Svelte auto-escaping + CSP headers |
| **SQL Injection** | ✅ Drizzle parameterized queries |
| **Rate Limiting** | Tambahkan di hooks untuk login/API |
| **Input Validation** | Zod schemas di form actions |
| **File Upload** | Validate MIME type, max size, sanitize filename |
| **HTTPS** | Enforce via adapter/hosting |
| **Secrets** | Environment variables, tidak hardcode |
| **Audit Trail** | Log semua write operations ke `audit_log` |
| **CORS** | Restrict API routes jika diperlukan |
| **Dependency** | Regular `npm audit`, update dependencies |

### Headers to Add (di `hooks.server.ts`)
```typescript
response.headers.set('X-Frame-Options', 'DENY');
response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
```

---

## Steps Implementasi

1. **Setup database schema** - Extend `schema.ts` dengan tabel-tabel di atas menggunakan Drizzle ORM
2. **Implement role system** - Tambah `role` field di `user` table dan buat helper `hasPermission()` di `auth.ts`
3. **Create base layout** - Buat dashboard layout dengan sidebar, navbar, dan toast system di `src/routes/(app)/+layout.svelte`
4. **Build core modules** - Implementasi modul satu per satu: Keuangan → Kegiatan → Jamaah → Inventaris → Donasi → Pengumuman
5. **Add caching layer** - Integrasi Redis/KV untuk dashboard statistics dan frequently accessed data
6. **Security hardening** - Tambahkan rate limiting, security headers, dan input validation dengan Zod

---

## Further Considerations

1. **Payment Gateway** - Integrasi Midtrans/Xendit untuk donasi online? Perlu setup merchant account dan webhook handler.
2. **Notification System** - Push notification via FCM atau email via Resend/SendGrid untuk reminder kegiatan?
3. **Multi-tenancy** - Apakah sistem akan support multiple masjid dalam satu instance? Perlu tambah `mosque_id` di semua tabel.
4. **Mobile App** - Apakah perlu PWA support atau native app terpisah untuk jamaah?
