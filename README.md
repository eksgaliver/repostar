# S.T.A.R.S — Enterprise Multi-Company HRIS & Fleet Logistics ERP

Implementasi dari `product_requirements_document_prd.md` (WMPL) sebagai **tiga project terpisah**
di dalam satu workspace:

| Folder | Stack | Peran |
| --- | --- | --- |
| `erp-backend-api` | Bun 1.4 · ElysiaJS · Drizzle ORM · PostgreSQL 17 | API + skema database multi-tenant |
| `erp-web-dashboard` | Next.js 16 App Router · TypeScript · Tailwind CSS 4 · **seluruh** Arc UI | Dashboard HRIS, operasional, matriks 1–31 |
| `erp-mobile-app` | Expo SDK 58 · React Native 0.88 · TypeScript | Aplikasi lapangan (absensi geofence, matriks harian) |

Brand: **S.T.A.R.S** · bundle id `com.stars.raihanrivana` · slug/scheme `stars`.

## Nyalakan otomatis

Semua lewat `npm run` — tanpa file `.cmd`, tanpa dependency tambahan. Log diberi prefix
`api │`, `web │` sehingga satu terminal cukup, dan Ctrl+C mematikan seluruh proses beserta
anak prosesnya.

| Perintah | Yang dijalankan |
| --- | --- |
| `npm run api:web:mobile` | API + Web + Mobile |
| `npm run api:web` | API + Web |
| `npm run api:mobile` | API + Mobile |
| `npm run api` · `npm run all` | API saja · ketiganya (alias) |

Cek rencana tanpa menjalankan apa pun:

```bash
npm run api:web -- --dry-run
```

Runner `scripts/dev.mjs` menjalankan `bun install` bila `node_modules` belum ada, membuat `.env`
API dari `.env.example`, lalu spawn `bun run dev` / `bun run start` per project. Metro memakai TTY
asli sehingga tombol `a` / `i` / `w` dan QR Expo tetap berfungsi. Port: API `4000` · Web `3000` ·
Metro `8081`; runner memberi peringatan bila sebuah project berhenti.

Sekali saja, setelah Postgres siap:

```bash
bun run db:push && bun run db:seed
```

## Nyalakan manual

```bash
# Backend
cd erp-backend-api
cp .env.example .env          # isi DATABASE_URL
bun install
bun run dev                   # http://localhost:4000  (Swagger: /docs)

# Web
cd ../erp-web-dashboard
bun install
bun run dev                   # http://localhost:3000

# Mobile
cd ../erp-mobile-app
bun install
bun run start                 # Expo Go / dev build
```

Atau lewat root: `bun run dev:api`, `dev:web`, `dev:mobile`.

## Cakupan PRD (A + B + C)

Build ini mengikuti PRD 194 baris: modul **A (admin & master data)**, **B (Inter-Company Portal)**, dan
**C (HRIS, absensi, ESS, aset)**. Modul **D (rute/DO/FIFO)** dan **E (matriks & KPI)** sengaja tidak
dikerjakan sesuai permintaan; route lamanya masih ada tetapi tidak lagi masuk navigasi.

| Modul | Yang tersedia |
| --- | --- |
| A.1–A.2 | CRUD perusahaan, wilayah, cabang (kode wilayah → awalan ID karyawan, timezone per wilayah) |
| A.3–A.4 | CRUD departemen + hierarki 6 peran (termasuk `kpi_admin`), shift per hari (Senin–Sabtu) |
| A.5 | Master unit (nomor polisi, merek/model, tahun, spesifikasi, wilayah, Korlap) |
| B.1 | Company switcher dari `company_memberships` (pindah tenant tanpa login ulang) |
| B.2 | Direktori SDM terbatas + secondment/mutasi dengan approval berjenjang (HR asal → HR tujuan → Super Admin) |
| B.4 | Izin berbagi data granular (summary, armada, direktori, OA, personal — dua terakhir terkunci default) |
| B.5 | Dashboard konsolidasi grup (populasi, kehadiran, armada, KM per perusahaan) |
| C.1 | Karyawan S/D/MK, ID `PK.D.001`, profil SIM/mekanik terpisah, jenis & tanggal berakhir kontrak |
| C.2 | Clock-in multi-lokasi: selfie URL, flag mock-location, `source`, `syncedAt` untuk antrean offline |
| C.3 | Cutoff 26–25, C vs CDT, pengajuan cuti/WFH/dinas/sakit/koreksi/**lembur**/**reimbursement**, approval Kadiv → validasi HR |
| C.4 | Inventaris aset + bulletin dengan approval Admin HR |
| C.5 | Export rekap `.xlsx` tanpa dependency (writer ZIP+XLSX sendiri di `src/lib/xlsx.ts`) |

Belum diimplementasikan (butuh infra/layanan tambahan): object storage presigned URL untuk selfie &
struk (sekarang disimpan sebagai URL), antrean offline nyata di mobile (`expo-sqlite`), UI lokasi
geofence, form Tier/Level (milik Admin KPI), dan fleet sharing antar perusahaan (B.3) karena
bergantung pada DO di modul D.

Setelah menarik perubahan ini jalankan `bun run db:push` — ada tabel baru (`company_memberships`,
`secondments`, `data_sharing_rules`) serta kolom/enum baru (role `kpi_admin`, tipe pengajuan
`lembur`/`reimbursement`, kolom kontrak & tier/level, field selfie/mock di absensi).

## Pola MVC (erp-backend-api)

```
src/
  controllers/   C - alur HTTP + auth/RBAC. Satu-satunya lapisan yang menyentuh `headers`.
  models/        M - service & query Drizzle + aturan bisnis (cutoff, C/CDT, KPI, FIFO).
  views/         V - pembentuk response; satu-satunya tempat yang memutuskan apa yang keluar.
  middleware/    guard(), signToken(), hasRole(), canAccessCompany().
  db/            schema + client + seed (data layer yang dipakai models).
  lib/           cutoff, performance, employee-code (dipakai models).
```

Aturan alur: **controller** memanggil `guard()` → memanggil **model** → hasilnya dikirim ke **view**.
Token berupa ticket HMAC-SHA256 (`base64url(payload).signature`, TTL 12 jam) tanpa dependency baru.
Di production request tanpa `Authorization: Bearer …` ditolak; di development ada fallback ke Super
Admin pertama supaya dashboard tetap bisa dipakai sebelum layar login dibuat.

Endpoint auth & tenant:

- `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`
- `GET /company/wmpl` → payload workspace WMPL (dipakai halaman web & mobile)

## Halaman khusus WMPL

`/wmpl` (web) dan tab **WMPL** (mobile) menampilkan identitas WMPL, wilayah & cabang beserta
timezone, 11 departemen, ringkasan operasional hari ini (KM, unit bekerja, standby, perbaikan,
DO menunggu OA), dan bulletin internal. Keduanya membaca payload yang sama dari
`GET /company/wmpl`.

## Yang sudah selesai

**erp-backend-api**
- Skema Drizzle lengkap: companies, regions, branches, departments, shifts + shift_days,
  attendance_locations (multi-geofence), employees + driver_profiles/mechanic_profiles,
  users + RBAC, attendances, attendance_requests, leave_balances, cutoff_periods, units,
  unit_assignments, unit_targets, customers, routes, route_versions, route_filters,
  delivery_orders, operation_matrices, assets, bulletins, audit_logs.
- Aturan bisnis di kode: cutoff 26→25, telat 0 menit, C vs CDT, versioning OA per bulan,
  B.M/A.M tidak masuk total KM, PIC dikunci untuk non-admin, status wajib `info`.
- Endpoint: `/auth/*`, `/company/*`, `/master/*`, `/people/*`, `/attendance/*`,
  `/operations/*` (termasuk `/fifo`, `/kpi`, `/dashboard/region`), `/content/*`,
  `/account/*`, `/health`, `/docs`.
- Seed WMPL: 4 wilayah, 8 cabang, 11 departemen, shift Senin–Sabtu, 8 geofence, 5 akun admin,
  contoh supir/unit/rute/DO/matriks. `bun run typecheck` bersih.

**erp-web-dashboard**
- Seluruh registry Arc UI di-vendor (128 komponen, 146 item) + galeri yang menampilkan
  **semua varian tombol** (Button, ButtonGroup + dropdown, SplitButton, ActionButton,
  ActionSwap, ExpandingButtonGroup, FloatingButtonGroup, CopyButton, HoldToConfirm,
  ConfirmMorph, IconMorph, DropdownMenu, ContextMenu, ThemeSwitch 4 varian, SwipeActions,
  UserMenu, Reactions) dan katalog lengkap dengan pencarian.
- Halaman: **dashboard metrik** (`/`, komposisi Arc `metric-card` + `bar-chart` +
  `donut-chart` + `gauge` + `progress`, membaca `/operations/kpi`,
  `/operations/dashboard/region`, `/attendance/recap`), workspace WMPL (`/wmpl`), master data,
  karyawan, kehadiran, rute & DO & FIFO, matriks operasional 1–31 dengan warna PIC/status,
  laporan & rumus KPI, profil, ubah sandi, lupa sandi, dan reset sandi.
- Rumus PRD dipusatkan di `src/lib/metrics.ts` (capaian, target ⌈tgl×3,33%⌉, band warna,
  pengecualian B.M/A.M).
- `bun run build` lolos (13 route statis).

**erp-mobile-app**
- `app.json`: nama S.T.A.R.S, package `com.stars.raihanrivana`, plugin expo-location,
  expo-sqlite, expo-notifications.
- Pustaka port Arc UI untuk React Native: token light/dark + ±80 dari 128 komponen registry.
  `registry.tsx` mengekspos semua 128 nama — yang belum diport mengembalikan `ported: false`
  beserta alasan. Lihat `src/components/arc/MANIFEST.md` untuk peta lengkap.
- `App.tsx` dengan tab **Beranda** dan **WMPL**; layar WMPL di `src/screens/WmplScreen.tsx`
  memakai komponen Arc yang sama dengan web.
- `bunx tsc --noEmit` bersih dan `bunx expo export --platform android` berhasil.

## Profil & sandi

Alur akun lengkap, tiga halaman web + enam endpoint API:

| Halaman | Isi |
| --- | --- |
| `/profile` | identitas akun + karyawan (ID, tipe, wilayah, departemen), form edit profil, tab **Keamanan** untuk ubah sandi |
| `/forgot-password` | minta token reset; di mode development token ditampilkan karena belum ada layanan email |
| `/reset-password` | tempel/buka token, buat sandi baru, verifikasi token sekali pakai |

Aturan yang berlaku di `erp-backend-api/src/modules/account.ts`:

- Sandi disimpan sebagai hash Argon2 (`Bun.password`), tidak pernah dikirim balik ke klien.
- Ubah sandi wajib memverifikasi sandi lama, minimal 8 karakter, dan harus berbeda.
- Token reset disimpan sebagai SHA-256, sekali pakai, kedaluwarsa 30 menit; token lama dibatalkan
  saat minta token baru atau setelah sandi berhasil diubah.
- `forgot-password` selalu menjawab `{ ok: true }` supaya email tidak bisa ditebak.

Tabel `password_reset_tokens` baru ikut terbuat saat `bun run db:push`. Belum ada auth sesi:
user diambil dari Super Admin pertama (atau `?userId=`), ditandai TODO untuk diganti JWT.

## Arsip

Monorepo lama (Express + Vite + Expo, `packages/shared`) dipindahkan apa adanya ke
`_archive/monorepo-2026-11-21/` — masih bisa dibaca bila ada yang perlu dirujuk.

## Langkah berikutnya

- Auth JWT + guard RBAC di API, lalu panggil API dari web/mobile (sekarang memakai data contoh).
- TanStack Table v8 + virtualisasi untuk matriks 31 kolom × ratusan unit.
- Export `.xlsx` (SheetJS) untuk rekap cutoff dan matriks.
- Sisa port Arc UI ke React Native sesuai daftar di MANIFEST.