import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { StructurePanels } from "@/components/admin/StructurePanels";
import { Card } from "@/components/ui/Card";
import { Muted, PageHeader } from "@/components/ui/Table";

export const metadata: Metadata = { title: "Struktur & shift · S.T.A.R.S" };

const roles = [
  { code: "super_admin", label: "Super Admin", scope: "Lintas perusahaan, master tenant, persetujuan mutasi" },
  { code: "admin", label: "Admin (read-only)", scope: "Melihat seluruh laporan & matriks" },
  { code: "hr_admin", label: "Admin HR", scope: "Karyawan, shift, absensi/cuti, aset, bulletin" },
  { code: "opr_admin", label: "Admin OPR", scope: "Data & approval operasional armada" },
  { code: "kpi_admin", label: "Admin KPI", scope: "Tier/level karyawan & evaluasi performa" },
  { code: "manager", label: "Manager / Kadiv", scope: "Approval bawahan & pengumuman divisi" },
];

export default function StructurePage() {
  return (
    <>
      <PageHeader
        title="Struktur organisasi & shift"
        description="Departemen dinamis, peran Kepala Divisi / Korlap / Staff, jadwal shift per hari, dan hierarki RBAC berjenjang."
        aside={
          <>
            <Badge tone="info" pill>
              6 peran
            </Badge>
            <Link href="/perusahaan">
              <Button size="sm" variant="secondary">
                Kembali ke perusahaan
              </Button>
            </Link>
          </>
        }
      />

      <StructurePanels />

      <Card
        title="Hierarki hak akses"
        description="Berjenjang per tenant. Approval pengajuan berhenti di Kepala Divisi sebelum validasi Admin HR."
        meta="RBAC"
        status="6 peran"
      >
        <ul className="list-rows">
          {roles.map((role) => (
            <li key={role.code} className="flex items-start justify-between gap-3">
              <span className="flex flex-col">
                <span className="font-medium">{role.label}</span>
                <Muted>{role.scope}</Muted>
              </span>
              <code className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                {role.code}
              </code>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}