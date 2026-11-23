import type { Metadata } from "next";
import { Badge } from "@/components/arc/badge/badge";
import { ContentPanels } from "@/components/content/ContentPanels";
import { PageHeader } from "@/components/ui/Table";

export const metadata: Metadata = { title: "Aset & bulletin · S.T.A.R.S" };

export default function ContentPage() {
  return (
    <>
      <PageHeader
        title="Aset & internal bulletin"
        description="Pencatatan aset yang dipegang karyawan dan pengumuman divisi. Bulletin baru tayang setelah disetujui Admin HR."
        aside={
          <>
            <Badge tone="info" pill>
              inventaris
            </Badge>
            <Badge tone="warning" dot pill>
              approval HRD
            </Badge>
          </>
        }
      />

      <ContentPanels />
    </>
  );
}