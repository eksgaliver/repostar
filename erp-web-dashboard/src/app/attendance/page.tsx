import type { Metadata } from "next";
import { Badge } from "@/components/arc/badge/badge";
import { AttendanceWorkspace } from "@/components/attendance/AttendanceWorkspace";
import { PageHeader } from "@/components/ui/Table";

export const metadata: Metadata = { title: "Kehadiran · S.T.A.R.S" };

export default function AttendancePage() {
  return (
    <>
      <PageHeader
        title="Kehadiran & ESS"
        description="Cutoff 26–25, toleransi 0 menit, cuti (C) vs CDT, serta pengajuan lembur dan reimbursement. Approval berjenjang: Kepala Divisi lalu validasi Admin HR."
        aside={
          <>
            <Badge tone="info" pill>
              26 – 25
            </Badge>
            <Badge tone="warning" dot pill>
              0 menit toleransi
            </Badge>
          </>
        }
      />

      <AttendanceWorkspace />
    </>
  );
}