import type { Metadata } from "next";
import { Badge } from "@/components/arc/badge/badge";
import { WmplWorkspace } from "@/components/wmpl/WmplWorkspace";
import { PageHeader } from "@/components/ui/Table";

export const metadata: Metadata = { title: "WMPL · S.T.A.R.S" };

/**
 * Dedicated workspace path for the built-in tenant.
 * The mobile app mirrors this screen at `src/screens/WmplScreen.tsx`.
 */
export default function WmplPage() {
  return (
    <>
      <PageHeader
        title="Workspace WMPL"
        description="Halaman khusus Wijaya Manggala Premier Lestari: identitas perusahaan, wilayah & cabang, departemen, ringkasan operasional harian, dan bulletin internal. Sumber data: GET /company/wmpl."
        aside={
          <>
            <Badge tone="success" dot pill>
              tenant bawaan
            </Badge>
            <Badge tone="info" pill>
              web + mobile
            </Badge>
          </>
        }
      />

      <WmplWorkspace />
    </>
  );
}