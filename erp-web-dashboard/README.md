# S.T.A.R.S — ERP Dashboard

Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + the **entire** Arc UI registry
(vendored from `uiarc.dev`). Container app: `com.stars.raihanrivana` / slug `stars`.

## Run

```bash
bun install
bun run dev            # http://localhost:3000
bun run build          # production build (verified)
```

The API is optional while browsing: every screen falls back to the sample rows in
`src/lib/sample.ts`. Point it at `erp-backend-api` by replacing those imports with
`fetch(process.env.NEXT_PUBLIC_API_URL + "/...")`.

## Layout

```
src/
  app/
    layout.tsx          shell + Arc foundation.css
    page.tsx            METRICS DASHBOARD (Arc MetricCard/BarChart/DonutChart/Gauge)
    components/         GALERI Arc UI: semua varian tombol + katalog 146 item
    master/             perusahaan, wilayah, cabang, departemen, shift, geofence
    people/             karyawan S/D/MK, RBAC, aset
    attendance/         cutoff 26–25, approval, multi-timezone
    operations/         rute + versioning OA, DO Relation→Marketing, FIFO
    matrix/             matriks operasional tanggal 1–31 + KPI warna
    reports/            rekap & export .xlsx
    profile/            profil + ubah sandi (tab Keamanan)
    forgot-password/    minta token reset
    reset-password/     buat sandi baru dari token
  components/
    arc/                VENDORED registry (jangan diedit; 128 komponen, 146 item)
    app-shell/          sidebar + topbar
    gallery/            ActionGallery, PrimitiveGallery, ArcCatalog
    ui/                 Table, PageHeader
  lib/                  navigation, sample data
```

## Aturan Arc

- Seluruh registry di-vendor, bukan sebagian: `src/components/arc` berisi 128 direktori
  komponen + blok, plus `registry.generated.json` dan `MANIFEST.md`.
- **Jangan edit** folder `arc`; bungkus komponennya di `src/components/`.
- Token ada di `arc/foundation.css` (di-import sekali di `app/layout.tsx`). Dark mode:
  `<html data-theme="dark">`. Accent: `data-accent="teal|sky|orchid|violet|…"`.
- `src/components/arc/blocks` dikecualikan dari type-check (`tsconfig.json`) karena blok
  marketing itu tidak dipakai dashboard dan salah satunya bertabrakan dengan tipe React 19.

## Galeri Arc UI

`/components` menampilkan:

- **Semua varian tombol**: Button (4 varian + loading/disabled + morph label), ButtonGroup
  (+ dropdown menu, solid, vertikal), SplitButton, ActionButton, ActionSwap,
  ExpandingButtonGroup, FloatingButtonGroup, CopyButton, HoldToConfirm, ConfirmMorph
  (press/hold/countdown), IconMorph, DropdownMenu, ContextMenu, ThemeSwitch (4 varian),
  SwipeActions, UserMenu, Reactions.
- Primitif yang dipakai dashboard: Badge, Rating, Input, SearchField, Switch, Skeleton,
  EmptyState, Card.
- **Katalog registry lengkap** (146 item) dengan pencarian dan filter jenis.

## Profil & sandi

`/profile` memanggil `GET/PATCH /account/profile`, `/account/change-password`,
`/account/forgot-password`, dan `/account/reset-password` di `erp-backend-api`.
Set `NEXT_PUBLIC_API_URL` (lihat `.env.example`) bila API tidak di `localhost:4000`.
Kalau API mati, halaman profil tetap tampil dengan data contoh dan memberi peringatan.

## Dashboard metrik (PRD §D)

Acuan visual: screen **Metrics dashboard** milik Arc (`uiarc.dev/components/screens/metrics-dashboard`).
Screen itu produk **Arc Pro**, jadi source-nya tidak ada di registry publik (`/r/metrics-dashboard.json`
→ 404, registry id hanya didokumentasikan untuk paket Pro). Karena itu anatominya dibangun ulang
di `src/components/dashboard/MetricsDashboard.tsx` memakai primitif Arc yang memang sudah
ter-vendor di repo ini.

Anatomi yang diikuti:

- toolbar: rentang waktu, filter unit, dan kontrol urutan
- KPI tabs (KM / Trip) di atas **satu** chart
- breakdown per dimensi (status, PIC, kehadiran)
- goal per unit terhadap target KM
- tabel sortable, baris bisa diklik → detail panel

| Arc | Dipakai untuk |
| --- | --- |
| `metric-card` | Total KM, capaian vs target berjalan, total trip, DO diminta |
| `bar-chart` | tren KM/trip harian dengan garis rata-rata |
| `gauge` | capaian bulan terhadap target tanggal berjalan |
| `progress` | goal per unit + realisasi unit vs DO |
| `donut-chart` | status, PIC, dan komposisi kehadiran |
| `dropdown-menu`, `button` | range/filter/sort dan KPI tabs |

Rumus PRD dipusatkan di `src/lib/metrics.ts` (bukan di komponen):
`capaian = totalKm / targetKm * 100`, `target berjalan = ceil(tanggal * 3,33)`, band
hijau/cream/merah, dan `B.M`/`A.M` tidak masuk total. `dailySeries`, `statusMixOf`, dan
`picMixOf` menurunkan seri harian & breakdown dari sel matriks. `src/lib/sample.ts` me-re-export
`runningTarget`, `band`, `bandColour` supaya halaman lain tidak berubah.

Data diambil paralel dari `GET /operations/kpi`, `GET /operations/dashboard/region`,
`GET /attendance/recap`, dan `GET /operations/matrix?month=YYYY-MM`; bila API mati halaman
memakai data seed dan menampilkan badge "data contoh". Tanggal berjalan dibaca di `useEffect`
karena `cacheComponents` menolak `new Date()` saat prerender.

## Design language

Shell memakai tata letak bergaya dashboard shadcn (sidebar ber-ikon + topbar dengan breadcrumb dan
pencarian halaman, kartu lebih padat, halaman berlatar `--surface-muted`), tetapi **semua visual
tetap komponen & token Arc**:

| Elemen | Sumber |
| --- | --- |
| Sidebar, topbar, breadcrumb, workspace switcher | komposisi sendiri + token Arc (`--surface`, `--border`) |
| Pencarian halaman, theme switch, user menu | `search-field`, `theme-switch`, `user-menu` (Arc) |
| Kartu | `ui/Card` → Arc `card` + class `ui-card` untuk radius/padding 10px/16px |
| Tabel | `ui/Table` (`.data-table`) + toolbar `search-field` di kartu KPI |
| Metrik | `metric-card`, `bar-chart`, `donut-chart`, `gauge`, `progress` |

Sidebar bisa diciutkan (ikon saja) dan preferensinya disimpan di `localStorage` (`stars:nav`), sama
seperti tema (`stars:theme`). Tidak ada komponen Arc yang ditulis ulang — penyesuaian densitas
dilakukan lewat CSS di `globals.css` yang menargetkan struktur kartu.

## Catatan

- **Tailwind lewat PostCSS**, bukan loader `@tailwindcss/turbopack`. Loader itu mem-parse semua
  `*.css` termasuk CSS module Arc dan gagal di `:global(:root[data-theme="dark"])`, sehingga
  aturan dark theme hilang. Konfigurasi sekarang: `postcss.config.mjs` +
  `@tailwindcss/postcss`; CSS module kembali ditangani css-loader.
- `allowedDevOrigins` di `next.config.ts` mengizinkan `192.168.1.2` / `192.168.1.*` dan
  `10.0.2.2` supaya HMR tetap jalan saat dashboard dibuka dari HP atau emulator Android.
- **URL API mengikuti host dashboard.** Tanpa `NEXT_PUBLIC_API_URL`, browser memakai
  `window.location.hostname` + port `4000`, jadi membuka `192.168.1.2:3000` memanggil
  `192.168.1.2:4000`. Isi `NEXT_PUBLIC_API_URL` hanya bila API berada di host/port lain.
- API mengizinkan origin `localhost` / `127.0.0.1` / IP LAN privat saat `NODE_ENV` bukan
  `production` (`isCorsOriginAllowed()` di `erp-backend-api/src/config.ts`). Di production hanya
  daftar `CORS_ORIGIN` yang berlaku.
- Setelah mengubah `next.config.ts` atau `postcss.config.mjs`, **restart** dev server.

`create-next-app` tetap membuat repo git sendiri di folder ini meski dijalankan dengan
`--no-git`. Hapus `erp-web-dashboard/.git` bila ingin menyatukannya dengan repo workspace.