/**
 * Sample rows so every screen renders without a database.
 * Replace with `fetchApi()` calls once the API is seeded and running.
 */

export interface RegionRow {
  code: string;
  name: string;
  timezone: string;
  branches: string[];
}

export const regions: RegionRow[] = [
  { code: "PK", name: "Riau", timezone: "Asia/Jakarta (WIB)", branches: ["Pekanbaru", "Dumai"] },
  { code: "KT", name: "Kalimantan Timur", timezone: "Asia/Makassar (WITA)", branches: ["Bontang", "Melak", "Labanan"] },
  { code: "KH", name: "Kalimantan Tengah", timezone: "Asia/Jakarta (WIB)", branches: ["Sampit"] },
  { code: "KB", name: "Kalimantan Barat", timezone: "Asia/Jakarta (WIB)", branches: ["Sambas", "Ketapang"] },
];

export const departments = [
  "Akunting",
  "Finance",
  "Legal",
  "Pajak",
  "HRD",
  "Relation",
  "Marketing",
  "Operasional",
  "Pembelian",
  "Gudang",
  "Maintenance",
];

export const shiftDays = [
  { day: "Senin", start: "08:00", end: "17:00", work: true },
  { day: "Selasa", start: "08:00", end: "17:00", work: true },
  { day: "Rabu", start: "08:00", end: "17:00", work: true },
  { day: "Kamis", start: "08:00", end: "17:00", work: true },
  { day: "Jumat", start: "08:00", end: "17:00", work: true },
  { day: "Sabtu", start: "08:00", end: "12:00", work: true },
  { day: "Minggu", start: "—", end: "—", work: false },
];

export interface EmployeeRow {
  code: string;
  name: string;
  type: "S" | "D" | "MK";
  region: string;
  department: string;
  role: string;
}

export const employees: EmployeeRow[] = [
  { code: "PK.S.001", name: "Raihan Rivana", type: "S", region: "PK", department: "Operasional", role: "Admin Sistem" },
  { code: "PK.D.001", name: "Andi Saputra", type: "D", region: "PK", department: "Operasional", role: "Supir" },
  { code: "PK.D.002", name: "Budi Hartono", type: "D", region: "PK", department: "Operasional", role: "Supir" },
  { code: "KT.MK.001", name: "Joko Prasetyo", type: "MK", region: "KT", department: "Maintenance", role: "Mekanik" },
  { code: "KH.S.001", name: "Siti Aminah", type: "S", region: "KH", department: "HRD", role: "Kepala Divisi" },
  { code: "KB.S.002", name: "Dewi Lestari", type: "S", region: "KB", department: "Relation", role: "Staff" },
];

/** Status codes with their matrix colour role (PRD section D.3). */
export const statusLegend = [
  { code: "P.M", label: "Perjalanan Muat", tone: "orange" },
  { code: "P.B", label: "Perjalanan Bongkar", tone: "orange" },
  { code: "KM", label: "Jarak tempuh", tone: "white" },
  { code: "TPR", label: "Terminal Perhubungan Regist", tone: "orange" },
  { code: "TR", label: "Terminal Regist", tone: "orange" },
  { code: "A.B", label: "Antri Bongkar", tone: "orange" },
  { code: "S.T", label: "Standby", tone: "blue" },
  { code: "NUP", label: "Perbaikan di Pool", tone: "blue" },
  { code: "NUPL", label: "Perbaikan di Luar Pool", tone: "blue" },
  { code: "PART", label: "Menunggu sparepart", tone: "gray" },
  { code: "REJECT", label: "Muatan ditolak", tone: "red" },
  { code: "INSIDEN", label: "Kecelakaan", tone: "red" },
  { code: "B.M", label: "Batal muat", tone: "yellow" },
  { code: "A.M", label: "Alih muat", tone: "yellow" },
  { code: "HUJAN", label: "Lintasan tidak dapat dilalui", tone: "gray" },
  { code: "TAS", label: "Tidak ada supir", tone: "gray" },
  { code: "C", label: "Supir cuti", tone: "gray" },
];

export interface MatrixCell {
  day: number;
  status: string | null;
  km?: number;
  pic?: "Operasional" | "Marketing/Alam";
  info?: string;
}

export const matrixDays: number[] = Array.from({ length: 31 }, (_, index) => index + 1);

export const sampleMatrix: Record<string, MatrixCell[]> = {
  "BM 8842 RA": [
    { day: 1, status: "P.M" },
    { day: 2, status: "KM", km: 132, pic: "Operasional" },
    { day: 3, status: "S.T", pic: "Marketing/Alam", info: "Menunggu DO berikutnya" },
    { day: 4, status: "NUP", info: "Ganti kampas rem" },
    { day: 5, status: "PART" },
    { day: 6, status: "B.M", info: "Customer tutup" },
    { day: 7, status: "KM", km: 132 },
    { day: 8, status: "A.M", info: "Dialihkan ke rute Dumai" },
  ],
  "BM 9011 RA": [
    { day: 1, status: "KM", km: 132 },
    { day: 2, status: "P.B" },
    { day: 3, status: "S.T" },
    { day: 4, status: "REJECT", info: "Kadar air di atas standar" },
    { day: 5, status: "KM", km: 264 },
    { day: 6, status: "INSIDEN", info: "Tabrakan ringan di KM 42" },
  ],
};

export interface RouteRow {
  code: string;
  customer: string;
  route: string;
  cargo: string;
  distanceKm: number;
  oaAmount: number;
  period: string;
}

export const routes: RouteRow[] = [
  { code: "PKU-DMI-2026-11", customer: "PT Sawit Nusantara", route: "Pekanbaru – Dumai", cargo: "CPO", distanceKm: 132, oaAmount: 1850000, period: "2026-11" },
  { code: "PKU-DMI-2026-10", customer: "PT Sawit Nusantara", route: "Pekanbaru – Dumai", cargo: "CPO", distanceKm: 132, oaAmount: 1780000, period: "2026-10" },
  { code: "BTG-MLK-2026-11", customer: "PT Kalimantan Prima", route: "Bontang – Melak", cargo: "Batu Bara", distanceKm: 208, oaAmount: 2640000, period: "2026-11" },
];

export interface DeliveryOrderRow {
  doNumber: string;
  route: string;
  cargo: string;
  units: number;
  oa: number | null;
  status: "pending" | "priced" | "scheduled";
}

export const deliveryOrders: DeliveryOrderRow[] = [
  { doNumber: "DO-202611-001", route: "PKU-DMI-2026-11", cargo: "CPO", units: 4, oa: null, status: "pending" },
  { doNumber: "DO-202611-002", route: "BTG-MLK-2026-11", cargo: "Batu Bara", units: 6, oa: 2640000, status: "priced" },
  { doNumber: "DO-202610-014", route: "PKU-DMI-2026-10", cargo: "CPO", units: 3, oa: 1780000, status: "scheduled" },
];

export interface RecapRow {
  employee: string;
  code: string;
  hadir: number;
  terlambat: number;
  cuti: number;
  cdt: number;
  alfa: number;
  kerja: number;
  libur: number;
}

export const recap: RecapRow[] = [
  { employee: "Andi Saputra", code: "PK.D.001", hadir: 18, terlambat: 2, cuti: 1, cdt: 0, alfa: 0, kerja: 26, libur: 4 },
  { employee: "Budi Hartono", code: "PK.D.002", hadir: 16, terlambat: 5, cuti: 0, cdt: 1, alfa: 3, kerja: 26, libur: 4 },
  { employee: "Siti Aminah", code: "KH.S.001", hadir: 21, terlambat: 0, cuti: 2, cdt: 0, alfa: 0, kerja: 26, libur: 4 },
  { employee: "Dewi Lestari", code: "KB.S.002", hadir: 20, terlambat: 1, cuti: 1, cdt: 0, alfa: 1, kerja: 26, libur: 4 },
];

export const kpiRows = [
  { plate: "BM 8842 RA", driver: "Andi Saputra", totalKm: 5940, targetKm: 9000, trips: 45, nup: 2, standby: 3 },
  { plate: "BM 9011 RA", driver: "Budi Hartono", totalKm: 7920, targetKm: 9000, trips: 60, nup: 1, standby: 1 },
];

/** PRD formulas live in lib/metrics; re-exported here for existing call sites. */
export {
  dailyTargetPercent as runningTarget,
  bandOf as band,
  bandColour,
} from "./metrics";