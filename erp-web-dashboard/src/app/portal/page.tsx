import type { Metadata } from "next";
import { Badge } from "@/components/arc/badge/badge";
import { PortalWorkspace } from "@/components/portal/PortalWorkspace";
import { PageHeader } from "@/components/ui/Table";

export const metadata: Metadata = { title: "Portal antar perusahaan · S.T.A.R.S" };

export default function PortalPage() {
  return (
    <>
      <PageHeader
        title="Portal antar perusahaan"
        description="Company switcher, direktori SDM terbatas, mutasi/peminjaman dengan approval bertingkat, izin berbagi data, dan dashboard konsolidasi grup."
        aside={
          <>
            <Badge tone="success" dot pill>
              multi-tenant
            </Badge>
            <Badge tone="info" pill>
              PRD §B
            </Badge>
          </>
        }
      />

      <PortalWorkspace />
    </>
  );
}