import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { ExportPanel } from "@/components/reports/ExportPanel";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/Table";

export const metadata: Metadata = { title: "Laporan · S.T.A.R.S" };

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Laporan kehadiran"
        description="Rekap per siklus cutoff sebagai jembatan data ke Payroll/Finance eksternal. Modul KPI dan matriks operasional tidak termasuk dalam build ini."
        aside={
          <>
            <Badge tone="success" dot pill>
              .xlsx
            </Badge>
            <Link href="/attendance">
              <Button size="sm" variant="secondary">
                Buka kehadiran
              </Button>
            </Link>
          </>
        }
      />

      <ExportPanel />

      <Card
        title="Rumus yang dipakai"
        description="Diimplementasikan di erp-backend-api/src/lib/cutoff.ts dan dipakai model attendance."
        meta="Referensi"
        status="3 aturan"
      >
        <ul className="list-rows">
          <li>
            <span className="flex flex-col">
              <span className="font-medium">Periode cutoff</span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Tanggal 26 bulan berjalan sampai 25 bulan berikutnya.
              </span>
            </span>
            <code className="text-[11px]">26 → 25</code>
          </li>
          <li>
            <span className="flex flex-col">
              <span className="font-medium">Keterlambatan</span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Lebih satu detik dari jam masuk shift = Terlambat (toleransi 0 menit).
              </span>
            </span>
            <code className="text-[11px]">0 menit</code>
          </li>
          <li>
            <span className="flex flex-col">
              <span className="font-medium">Cuti vs CDT</span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Saldo tersedia → C (saldo terpotong); saldo habis → CDT.
              </span>
            </span>
            <code className="text-[11px]">C / CDT</code>
          </li>
        </ul>
      </Card>

      <Card
        title="Kolom file"
        description="Header .xlsx yang dihasilkan endpoint export."
        meta="Template"
        status="9 kolom"
      >
        <div className="flex flex-wrap gap-2">
          {["ID Karyawan", "Nama", "Periode Mulai", "Periode Selesai", "Hadir (H)", "Terlambat", "Cuti (C)", "CDT", "Alfa"].map((column) => (
            <Badge key={column} size="sm" pill>
              {column}
            </Badge>
          ))}
        </div>
      </Card>
    </>
  );
}