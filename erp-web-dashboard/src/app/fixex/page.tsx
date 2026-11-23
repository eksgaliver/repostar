import type { Metadata } from "next";
import { FixexDashboard } from "@/components/dashboard/FixexDashboard";
import { PageHeader } from "@/components/ui/Table";

export const metadata: Metadata = { title: "Dashboard · Fixex" };

/**
 * Fixex dashboard. The role dropdown inside the panel switches the greeting,
 * the focus list, and the shortcuts, mirroring the RBAC roles the API enforces.
 */
export default function FixexDashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Ringkasan per peran: karyawan, manager, admin HR, admin OPR, admin KPI, admin read-only, dan super admin."
      />

      <FixexDashboard />
    </>
  );
}