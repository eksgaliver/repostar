# Product Requirements Document (PRD)
## Enterprise Multi-Company HRIS (Non-Payroll) & Fleet Logistics ERP

---

### 1. Ringkasan Eksekutif & Arsitektur Sistem

Sistem ini adalah aplikasi *Enterprise Resource Planning* (ERP) *cross-platform* berbasis *multi-tenant* (multi-perusahaan) yang mengintegrasikan manajemen sumber daya manusia (HRIS tanpa modul *payroll*/slip gaji), absensi lintas zona waktu, pemantauan operasional armada logistik secara *real-time*, serta **Portal Kolaborasi Antar Perusahaan (*Inter-Company Portal*)**.

* **Prinsip Isolasi Data (*Multi-Company*):** Setiap transaksi dan data master wajib terikat pada `company_id`. Perusahaan berbeda tidak dapat saling melihat data secara *default*, kecuali melalui mekanisme berbagi akses yang diatur pada **Portal Antar Perusahaan** atau diizinkan secara eksplisit oleh *Super Admin*.
* **Batasan Ruang Lingkup HRIS:** Sistem berfokus penuh pada *Core HR*, manajemen waktu/absensi, cuti, lembur, *reimbursement*, aset, dan KPI operasional. Sistem **tidak** memproses perhitungan gaji bersih, PPh 21, BPJS, maupun penerbitan slip gaji.
* **Arsitektur *Decoupled* (3 Repositori Terpisah):**
  1. **Backend API (`erp-backend-api`):** Bun 1.4 + ElysiaJS + Drizzle ORM + PostgreSQL 17 + DragonflyDB/Redis.
  2. **Web Dashboard (`erp-web-dashboard`):** Next.js (App Router) + TypeScript + Arc UI + TanStack Table v8 & Virtual + Tailwind CSS.
  3. **Mobile App (`erp-mobile-app`):** Expo (React Native New Architecture) + TypeScript + `expo-sqlite` (dukungan *offline-first* sinkronisasi absensi & log lapangan) + `expo-location`.

---

### 2. Skema Hierarki Admin & Hak Akses (RBAC)

Sistem menerapkan pemisahan hak akses (*Role-Based Access Control*) berjenjang pada setiap perusahaan (*tenant*):

```text
Super Admin (Global / Holding Level)
 └── Admin (Read-Only / Auditor & Monitoring)
      ├── Admin HR        ──► Menangani administrasi karyawan, absensi, cuti, & aset
      ├── Admin OPR       ──► Menangani input data & approval operasional armada
      ├── Admin KPI       ──► Menangani informasi KPI, tier/level karyawan, & evaluasi performa
      └── Manager / Kadiv ──► Memiliki anggota tim, melakukan approval bawahan & monitoring divisi
```

* **Super Admin:** Akses penuh lintas perusahaan, manajemen master perusahaan, konfigurasi sistem global, persetujuan mutasi unit lintas wilayah, dan pengaturan izin Portal Antar Perusahaan.
* **Admin (Read-Only):** Hak akses melihat seluruh laporan dan matriks operasional/HR tanpa hak ubah (*view-only* untuk manajemen puncak/direksi).
* **Admin HR:** Mengelola data karyawan, struktur organisasi, *shift*, validasi absensi/cuti/lembur/*reimbursement*, inventaris aset, serta persetujuan *Internal Bulletin*.
* **Admin OPR (Operasional):** Mengelola master rute, validasi DO, penentuan PIC operasional pada matriks harian, dan *approval* operasional armada.
* **Admin KPI:** Mengelola penilaian KPI, penetapan kombinasi `Tier` + `Level` karyawan, dan pembaruan data evaluasi performa.
* **Manager / Kepala Divisi:** Memiliki bawahan langsung, melakukan *approval* pengajuan tim (cuti, izin, WFH, dinas luar, lembur, koreksi absen), dan mengajukan pengumuman divisi.

---

### 3. Spesifikasi Modul & Aturan Bisnis

#### A. Modul Admin Sistem & Master Data Dinamis
1. **Manajemen Perusahaan (*Multi-Tenant*):**
   * Data bawaan untuk **WMPL (Wijaya Manggala Premier Lestari)** beserta dukungan penambahan entitas perusahaan baru (*sister company* / mitra grup) secara dinamis.
2. **Wilayah & Lokasi Operasional:**
   * **Data Awal WMPL:**
     * **Riau (`PK`):** Pekanbaru, Dumai (*Timezone*: `Asia/Jakarta` / WIB)
     * **Kalimantan Timur (`KT`):** Bontang, Melak, Labanan (*Timezone*: `Asia/Makassar` / WITA)
     * **Kalimantan Tengah (`KH`):** Sampit (*Timezone*: `Asia/Jakarta` / WIB)
     * **Kalimantan Barat (`KB`):** Sambas, Ketapang (*Timezone*: `Asia/Jakarta` / WIB)
   * Wilayah, cabang operasional, titik koordinat *geofencing*, dan kode wilayah dapat ditambah/diubah secara dinamis.
3. **Struktur Organisasi:**
   * **Departemen Bawaan:** Akunting, Finance, Legal, Pajak, HRD, Relation, Marketing, Operasional, Pembelian, Gudang, Maintenance (dinamis).
   * **Hierarki Departemen:** Setiap divisi memiliki peran **Kepala Divisi (Manager)**, **Koordinator Lapangan (Korlap)** (khusus divisi operasional/lapangan), dan **Staff / Operator / Supir / Mekanik**.
4. **Manajemen Shift & Multi-Lokasi Absensi:**
   * Konfigurasi jam masuk dan pulang per hari dalam semgu (contoh: Senin–Jumat `08:00–17:00`, Sabtu setengah hari `08:00–12:00`).
   * **Multi-Lokasi Absensi:** Satu karyawan dapat ditugaskan ke lebih dari satu titik koordinat lokasi absensi (*geofencing*) agar fleksibel saat bertugas lintas cabang/pool.
5. **Master Unit & Target Performa:**
   * Pengelolaan daftar unit/armada (Nomor Polisi, Nomor Lambung, Tahun Pembuatan, Spesifikasi) per wilayah dan per Korlap.
   * Input **Target KM Bulanan per Unit** oleh Admin Sistem secara dinamis (nilai target berbeda tiap wilayah sesuai kondisi medan dan rute).

---

#### B. Modul Portal Antar Perusahaan (*Inter-Company Portal*)
Portal khusus yang menjembatani kolaborasi dan visibilitas data terkontrol antar perusahaan yang terdaftar di dalam ekosistem ERP (misal antara **WMPL** dengan perusahaan afiliasi/grup):

1. **Company Switcher & Single Sign-On (SSO):**
   * Pengguna yang memiliki penugasan di lebih dari satu perusahaan dapat berpindah ruang kerja (*workspace*) perusahaan secara instan tanpa perlu melakukan *login* ulang.
2. **Direktori & Mutasi / Peminjaman SDM Lintas Perusahaan (*Secondment*):**
   * **Pencarian SDM Terbatas:** HR antar perusahaan dapat melihat status ketersediaan tenaga kerja (seperti Supir atau Mekanik yang berstatus *standby*/*idle*) jika diizinkan oleh perusahaan asal.
   * **Penugasan Lintas Perusahaan:** Mendukung mekanisme peminjaman sementara (*secondment*) atau mutasi permanen karyawan/supir dari Perusahaan A ke Perusahaan B dengan alur *approval* bertingkat (Admin HR Asal $\rightarrow$ Admin HR Tujuan $\rightarrow$ Super Admin) tanpa menduplikasi biodata inti.
3. **Berbagi Kapasitas Armada & Sub-Kontrak DO (*Cross-Company Fleet Sharing*):**
   * Jika permintaan *Delivery Order* (DO) di Perusahaan A melebihi kapasitas unit yang tersedia, Admin OPR/Relation dapat meneruskan (*dispatch*) permintaan unit tersebut ke **Portal Antar Perusahaan**.
   * Perusahaan mitra dalam grup dapat mengambil alih kuota DO tersebut menggunakan armada dan supir mereka sendiri, sementara pelacakan status pengiriman tetap terpantau secara *real-time* oleh perusahaan pemberi DO.
4. **Matriks Izin Berbagi Data (*Granular Data Sharing Permissions*):**
   * Super Admin dapat mengatur level keterbukaan data antar perusahaan secara spesifik (contoh: Perusahaan A dan B dapat saling melihat *Summary KPI* dan *Ketersediaan Armada*, namun detail *Ongkos Angkut (OA)* dan *Biodata Sensitif Karyawan* tetap terkunci).
5. **Dashboard Konsolidasi Grup (Executive View):**
   * Tampilan agregat khusus untuk *Super Admin* dan *Admin (Read-Only)* tingkat grup yang menggabungkan total populasi karyawan, tingkat kehadiran, total ritase/KM armada, dan pencapaian target seluruh perusahaan dalam satu layar.

---

#### C. Modul HRIS (Non-Payroll), Absensi Multi-Timezone & ESS

1. **Database Karyawan & Generator ID:**
   * **Pemisahan Tabel Profil:** Tabel biodata inti (`employees`) dipisah dengan tabel spesifikasi (`driver_profiles` untuk SIM/SIO/masa berlaku dan `mechanic_profiles` untuk keahlian teknis) guna mengoptimalkan performa *query*.
   * **Tipe Karyawan:** `S` (Staff/Karyawan), `D` (Supir/Driver), `MK` (Mekanik).
   * **Format ID Karyawan:** `[Kode Wilayah].[Tipe].[Nomor Urut Manual]` (Contoh: `PK.D.001`).
   * **Klasifikasi Tier & Level (Dikelola oleh Admin KPI):**
     * **Tier:** `Front` dan `Support`.
     * **Level:** `1`, `2`, `3`, `4`.
     * *Aturan Tampilan:* Informasi klasifikasi karyawan selalu ditampilkan sebagai gabungan **Tier + Level** (Contoh: `Front - Level 2` atau `Support - Level 1`).
   * **Manajemen Kontrak:** Pemantauan masa berlaku PKWT, PKWTT, *Probation*, dan notifikasi otomatis sebelum kontrak/SIM berakhir.

2. **Absensi Mobile & Multi-Timezone:**
   * *Live Attendance* menggunakan GPS (*Geofencing* multi-lokasi), deteksi *Mock Location* (*anti-fake GPS*), dan swafoto (*selfie*) dengan *watermark* waktu server.
   * *Timestamp* mencatat waktu riil sesuai zona waktu lokasi absensi karyawan (`WIB` atau `WITA`).
   * **Toleransi Keterlambatan:** **0 Menit** (terlambat 1 detik dari jadwal masuk shift langsung tercatat sebagai Terlambat).
   * **Dukungan Offline (`expo-sqlite`):** Jika karyawan berada di area *blank spot* (seperti area tambang/kebun), data absensi tersimpan terenkripsi di perangkat lokal dan otomatis tersinkronisasi ke server saat koneksi internet kembali tersedia.

3. **Siklus Cutoff, Cuti, Lembur & Reimbursement (ESS):**
   * **Periode Cutoff:** Tanggal **26 bulan berjalan s/d Tanggal 25 bulan berikutnya**.
   * **Alur Approval Pengajuan:** Pengajuan (Cuti, WFH, Dinas Luar, Sakit, Koreksi Absen, Lembur, *Reimbursement*) diajukan oleh karyawan melalui aplikasi *mobile* ke **Kepala Divisi / Manager** (dan diteruskan ke Admin HR untuk validasi akhir).
   * **Status Kehadiran Otomatis:**
     * Hadir = **`H`**
     * Tidak hadir tanpa keterangan = **`Alfa`** (berubah otomatis setelah pengajuan izin/cuti disetujui).
     * Pengajuan izin/cuti disetujui dengan saldo cuti tersedia = **`C`** (saldo cuti otomatis terpotong).
     * Pengajuan izin/cuti disetujui saat saldo cuti habis = **`CDT`** (Cuti Di Luar Tanggungan).
   * **Manajemen Lembur (*Overtime*):** Pengajuan jam lembur beserta alasan dan persetujuan atasan untuk direkap sebagai data mentah bagi tim *Finance* (tanpa perhitungan nominal rupiah di sistem).
   * **Klaim Operasional (*Reimbursement*):** Pengajuan klaim biaya perjalanan/operasional disertai unggah foto bukti struk/nota.

4. **Inventaris Aset & Internal Bulletin:**
   * **Inventaris Aset:** Pencatatan serah terima, kondisi, dan rincian aset perusahaan (laptop, HP operasional, seragam, APD, peralatan kerja) yang dipegang oleh setiap karyawan.
   * **Internal Bulletin:** Kepala Divisi dapat membuat draf pengumuman divisi/perusahaan yang baru akan tayang di aplikasi karyawan setelah mendapat *approval* dari **Admin HR**.

5. **Laporan Kehadiran & Export Excel:**
   * Rekapitulasi lengkap per siklus *cutoff* (Tgl 26 – 25): Jumlah Hari Kerja, Hari Libur, Hadir (`H`), Terlambat, Cuti (`C`), `CDT`, `Alfa`, serta rekap jam lembur, dengan fitur ekspor langsung ke format `.xlsx` sebagai jembatan data ke tim *Payroll/Finance* eksternal.

---

#### D. Modul Operasional: Rute, Delivery Order (DO) & Antrean FIFO

1. **Master Rute & Versioning Ongkos Angkut (OA) Bulanan:**
   * Data rute mencakup: Nama Customer, Rute (Asal–Tujuan), Jenis Cargo, Jarak (`KMPP`), dan Ongkos Angkut (`OA`).
   * **Versioning OA:** Karena tarif OA berubah setiap bulan, setiap pembaruan bulanan wajib menghasilkan **ID Rute Unik** baru agar histori transaksi dan pendapatan bulan-bulan sebelumnya tetap akurat dan tidak tertimpa.
2. **Permintaan Pengiriman Unit (Delivery Order / DO):**
   * **Halaman Relation:** Menginput Nomor DO, Rute, Jenis Cargo, dan Total Permintaan Unit (*field* nominal OA disembunyikan/tidak tersedia bagi tim Relation).
   * **Halaman Marketing:** Melihat daftar DO yang masuk dari Relation dan melengkapi nominal OA sesuai kontrak.
3. **Sistem Antrean FIFO (*First In First Out*):**
   * Mengatur urutan keberangkatan unit per rute secara otomatis berdasarkan waktu selesai bongkar terakhir (`S.T`).
   * Dikombinasikan dengan konfigurasi *filter* khusus per rute (misalnya: hanya nomor polisi terdaftar tertentu, tahun pembuatan unit minimal, atau spesifikasi bak/tangki tertentu).

---

#### E. Modul Workspace Matriks Operasional (Tanggal 1 – 31) & KPI Armada

1. **Relasi Unit – Supir & Mutasi Unit:**
   * **Aturan 1:1:** Satu unit hanya dipegang oleh satu supir di bawah pengawasan satu Korlap.
   * **Mutasi Supir:** Perpindahan supir ke unit lain memerlukan *approval* Admin Sistem / Admin OPR. Jika disetujui:
     * Seluruh rekam jejak performa (KM dan Trip) supir pada bulan berjalan otomatis berpindah mengikuti supir ke unit baru.
     * Unit lama otomatis tercatat berstatus **`TAS`** (Tidak Ada Supir) dari tanggal 1 hingga tanggal efektif perpindahan.

2. **Kode Status Harian & Validasi Input:**
   * `P.M`: Perjalanan Muat
   * `P.B`: Perjalanan Bongkar
   * `KM`: Jarak tempuh rute (otomatis bernilai sesuai `KMPP` rute terkait)
   * `TPR`: Terminal Perhubungan Regist
   * `TR`: Terminal Regist
   * `A.B`: Antri Bongkar
   * `S.T`: Standby (menunggu instruksi setelah bongkar)
   * `NUP`: Perbaikan di Pool/Workshop (**wajib menyertakan informasi kerusakan**)
   * `NUPL`: Perbaikan di Luar Pool (**wajib menyertakan lokasi & informasi kerusakan**)
   * `PART`: Menunggu suku cadang (*sparepart*)
   * `REJECT`: Muatan ditolak di titik pembongkaran (**wajib menyertakan informasi & alasan**)
   * `INSIDEN`: Terjadi kecelakaan (**wajib menyertakan lokasi & kronologi informasi**)
   * `C`: Supir cuti (unit tidak beroperasi)
   * `TAS`: Tidak ada supir
   * `B.M [KM]`: Batal muat disertai angka KM rute (misal `B.M 132`, **wajib informasi**, angka KM tidak dihitung ke total capaian)
   * `A.M [KM]`: Alih muat disertai angka KM rute (misal `A.M 132`, **wajib informasi**, angka KM tidak dihitung ke total capaian)
   * `HUJAN`: Lintasan tidak dapat dilalui karena faktor cuaca/hujan
   * **Status Progres Bengkel:** `BUBUT`, `RJ` (Rubah Jenis), `PR` (Peremajaan)

3. **Aturan PIC & Kode Warna Matriks (Tanggal 1 – Akhir Bulan):**
   * Saat Korlap memperbarui status harian, kolom PIC otomatis bernilai **`Operasional`**. Hanya Admin Sistem / Admin OPR yang berhak mengubah PIC menjadi **`Marketing/Alam`**.
   * **Kuning:** PIC `Marketing/Alam` untuk status `S.T`, `A.M`, `B.M`.
   * **Biru:** PIC `Operasional` untuk status `NUP`, `NUPL`, `S.T`.
   * **Abu-abu:** Status `PART`.
   * **Oranye:** Status operasional berjalan (`P.M`, `P.B`, `A.B`, `TR`, `TPR`).
   * **Putih:** Status `KM`.

4. **Kolom Rekapitulasi, Evaluasi & Rumus Performa:**
   * **Total KM:** Penjumlahan nilai pada sel `KM` saja (mengabaikan angka KM yang tercantum pada status `B.M` dan `A.M`).
   * **Informasi:** Catatan lapangan dengan *badge* otomatis **`Korlap`** (jika diisi oleh Korlap) atau **`Manajemen`** (jika diisi oleh Admin Sistem/OPR).
   * **Total Trip:** Jumlah kemunculan sel `KM` dalam satu bulan kalender.
   * **Total NUP & Total S.T:** Jumlah kemunculan masing-masing status dalam satu bulan.
   * **Kolom Tindak Lanjut:** `Problem` (diisi Admin Sistem/OPR), `Solusi` (diisi Manajemen), dan `SOP` (diisi Manajemen).
   * **Perhitungan & Warna Performance Harian:**
     $$\text{Capaian (\%)} = \left(\frac{\text{Total KM Supir}}{\text{Target KM Unit}}\right) \times 100\%$$
     $$\text{Target Tanggal Berjalan (\%)} = \lceil \text{Tanggal Berjalan} \times 3,33\% \rceil$$
     *(Contoh: Tanggal 1 = $\lceil 3,33\% \rceil \rightarrow 4\%$)*
     * **Hijau:** $\text{Capaian} \ge \text{Target Tanggal Berjalan}$.
     * **Kuning Muda (*Cream*):** $\text{Capaian}$ mencapai $80\% - 99\%$ dari Target Tanggal Berjalan.
     * **Merah:** $\text{Capaian} < 80\%$ dari Target Tanggal Berjalan.

5. **Dashboard Kepala Wilayah:**
   * Agregasi *real-time* harian seluruh Korlap di bawah wilayahnya: perbandingan Total KM tercapai terhadap Target KM Wilayah, serta rasio Total Permintaan DO terhadap Realisasi unit yang beroperasi pada hari tersebut.

---

### 4. Persyaratan Non-Fungsional & Keamanan Sistem

1. **Integritas Zona Waktu (*Timezone-Aware*):** Seluruh penyimpanan *timestamp* di PostgreSQL menggunakan `TIMESTAMPTZ` (UTC), sementara konversi tampilan dan validasi keterlambatan/cutoff dieksekusi berdasarkan zona waktu cabang (`Asia/Jakarta` atau `Asia/Makassar`).
2. **Keamanan File & Dokumen:** Bukti foto selfie absensi, foto insiden/perbaikan armada, dan struk *reimbursement* disimpan pada *Object Storage* (S3-compatible/MinIO) dengan akses *presigned URL* terbatas.
3. **Audit Trail Komprehensif:** Setiap perubahan pada matriks operasional (perubahan status atau PIC), persetujuan cuti, pembaruan OA rute, dan aktivitas lintas perusahaan pada *Inter-Company Portal* tercatat lengkap dengan identitas pengguna, waktu, serta nilai sebelum dan sesudah perubahan.