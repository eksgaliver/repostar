/**
 * Role profiles for the Fixex dashboard. Mirrors the RBAC roles the backend
 * already enforces (`super_admin | admin | hr_admin | opr_admin | kpi_admin |
 * manager | staff`), with the copy the dashboard shows per role.
 */
export type RoleValue =
  | "staff"
  | "manager"
  | "hr_admin"
  | "opr_admin"
  | "kpi_admin"
  | "admin"
  | "super_admin";

export interface RoleProfile {
  value: RoleValue;
  label: string;
  scope: string;
  focus: string[];
  actions: { label: string; href: string }[];
}

export const roles: RoleProfile[] = [
  {
    value: "staff",
    label: "Karyawan",
    scope: "Absensi harian, cuti, lembur, dan reimbursement lewat aplikasi mobile.",
    focus: [
      "Absen masuk/pulang dengan selfie dan geofence cabang",
      "Ajukan cuti, izin, WFH, dinas luar, atau koreksi absen",
      "Pantau status approval dari Kepala Divisi",
      "Lihat rekap kehadiran per siklus cutoff 26 – 25",
    ],
    actions: [
      { label: "Kehadiran & ESS", href: "/attendance" },
      { label: "Profil & keamanan", href: "/profile" },
    ],
  },
  {
    value: "manager",
    label: "Manager / Kadiv",
    scope: "Approval berjenjang untuk pengajuan bawahan dan pengumuman divisi.",
    focus: [
      "Setujui atau tolak cuti, lembur, dan reimbursement bawahan",
      "Pantau kehadiran anggota divisi",
      "Terbitkan pengumuman untuk divisi sendiri",
      "Tinjau performa tim sebelum evaluasi KPI",
    ],
    actions: [
      { label: "Karyawan", href: "/human-resources/karyawan" },
      { label: "Kehadiran & ESS", href: "/attendance" },
      { label: "Laporan", href: "/reports" },
    ],
  },
  {
    value: "hr_admin",
    label: "Admin HR",
    scope: "Karyawan, shift, absensi/cuti, aset, dan bulletin.",
    focus: [
      "Kelola data karyawan, kontrak, dan penempatan wilayah",
      "Atur departemen dan jadwal shift per hari",
      "Validasi akhir pengajuan setelah approval Kepala Divisi",
      "Terbitkan bulletin dan kelola aset inventaris",
    ],
    actions: [
      { label: "Karyawan", href: "/human-resources/karyawan" },
      { label: "Struktur & shift", href: "/perusahaan/structure" },
      { label: "Aset & bulletin", href: "/content" },
      { label: "Laporan", href: "/reports" },
    ],
  },
  {
    value: "opr_admin",
    label: "Admin OPR",
    scope: "Matriks operasional armada, unit, rute, dan approval operasional.",
    focus: [
      "Perbarui status harian matriks dan kolom PIC",
      "Kelola data unit, rute, dan OA rute",
      "Setujui mutasi supir dan perubahan operasional",
      "Cek capaian KM harian terhadap target unit",
    ],
    actions: [
      { label: "Master unit", href: "/units" },
      { label: "Laporan", href: "/reports" },
    ],
  },
  {
    value: "kpi_admin",
    label: "Admin KPI",
    scope: "Tier/level karyawan dan evaluasi performa.",
    focus: [
      "Tetapkan tier dan level karyawan",
      "Jalankan evaluasi performa per periode",
      "Tinjau perhitungan capaian KM dan warna band",
      "Ekspor rekap KPI untuk manajemen",
    ],
    actions: [
      { label: "Karyawan", href: "/human-resources/karyawan" },
      { label: "Laporan", href: "/reports" },
    ],
  },
  {
    value: "admin",
    label: "Admin (read-only)",
    scope: "Melihat seluruh laporan dan matriks tanpa hak ubah.",
    focus: [
      "Baca laporan kehadiran dan operasional",
      "Pantau matriks unit tanpa mengubah status",
      "Tidak ada akses approval maupun master data",
    ],
    actions: [
      { label: "Laporan", href: "/reports" },
      { label: "Metrik PRD", href: "/" },
    ],
  },
  {
    value: "super_admin",
    label: "Super Admin",
    scope: "Lintas perusahaan: master tenant, wilayah, dan approval mutasi.",
    focus: [
      "Kelola perusahaan, logo, dan warna brand",
      "Buka wilayah operasional serta cabang di bawahnya",
      "Setujui mutasi karyawan lintas perusahaan",
      "Akses penuh ke seluruh modul tenant",
    ],
    actions: [
      { label: "Perusahaan", href: "/perusahaan" },
      { label: "Wilayah & cabang", href: "/perusahaan/regions" },
      { label: "Portal antar perusahaan", href: "/portal" },
    ],
  },
];

export function roleByValue(value: string): RoleProfile {
  return roles.find((role) => role.value === value) ?? roles[6]!;
}

/**
 * Publishing letters is reserved for roles above a regular employee. The
 * read-only admin is excluded on purpose: it only reads reports.
 */
export const AUTHOR_ROLES: RoleValue[] = ["manager", "hr_admin", "opr_admin", "kpi_admin", "super_admin"];

/**
 * TEMPORARY: letters are open to every role for now. Flip this to false to
 * restore the rule above; the backend has the same switch.
 */
export const DOCUMENT_AUTHOR_OPEN = true;

export function canAuthor(role: RoleValue): boolean {
  if (DOCUMENT_AUTHOR_OPEN) return true;
  return AUTHOR_ROLES.includes(role);
}

/** Each role gets its own dashboard copy; the panel itself is only a greeting and a calendar. */
export interface RoleDashboard {
  greeting: string;
  note: string;
  calendarTitle: string;
  calendarNote: string;
}

export const dashboards: Record<RoleValue, RoleDashboard> = {
  staff: {
    greeting: "Halo, selamat datang",
    note: "Hari ini kamu bisa absen, mengajukan cuti, atau memeriksa status approval. Rekap kehadiran mengikuti siklus cutoff 26 – 25.",
    calendarTitle: "Kalender absensi",
    calendarNote: "Tanggal absen, hari libur, dan akhir siklus cutoff.",
  },
  manager: {
    greeting: "Halo, Kepala Divisi",
    note: "Pengajuan bawahan menunggu keputusanmu. Setiap approval tercatat lengkap dengan waktu dan nilai sebelum-sesudah.",
    calendarTitle: "Kalender approval",
    calendarNote: "Batas waktu approval cuti, lembur, dan reimbursement.",
  },
  hr_admin: {
    greeting: "Halo, Admin HR",
    note: "Data karyawan, jadwal shift, dan validasi akhir pengajuan ada di meja ini. Laporan periode siap diekspor ke .xlsx.",
    calendarTitle: "Kalender shift & cutoff",
    calendarNote: "Jadwal shift per hari dan penutupan siklus absensi.",
  },
  opr_admin: {
    greeting: "Halo, Admin OPR",
    note: "Matriks harian, status unit, dan capaian KM menunggu diperbarui. Setiap perubahan masuk audit trail.",
    calendarTitle: "Kalender operasional",
    calendarNote: "Jadwal matrix harian dan tenggat target KM.",
  },
  kpi_admin: {
    greeting: "Halo, Admin KPI",
    note: "Tier, level, dan evaluasi performa dihitung per periode. Capaian KM menjadi dasar warna band.",
    calendarTitle: "Kalender evaluasi",
    calendarNote: "Periode penilaian dan tanggal rilis hasil KPI.",
  },
  admin: {
    greeting: "Halo, Admin",
    note: "Akses baca untuk seluruh laporan dan matriks. Peran ini tidak memiliki aksi ubah atau approval.",
    calendarTitle: "Kalender laporan",
    calendarNote: "Tanggal rilis laporan kehadiran dan operasional.",
  },
  super_admin: {
    greeting: "Halo, Super Admin",
    note: "Lintas perusahaan: master tenant, wilayah operasional, dan approval mutasi. Anda memegang akses penuh.",
    calendarTitle: "Kalender tenant",
    calendarNote: "Siklus cutoff setiap perusahaan yang Anda kelola.",
  },
};