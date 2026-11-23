import type { Metadata } from "next";
import { Badge } from "@/components/arc/badge/badge";
import { UnitsPanel } from "@/components/admin/UnitsPanel";
import { PageHeader } from "@/components/ui/Table";

export const metadata: Metadata = { title: "Master unit · S.T.A.R.S" };

/**
 * PRD A.5 - unit/armada registry: plate, hull number, year, spec, region, Korlap.
 * Target KM lives with KPI, which this build excludes.
 */
export default function UnitsPage() {
  return (
    <>
      <PageHeader
        title="Master unit & armada"
        description="Daftar unit per wilayah dan per Korlap. Relasi 1:1 (satu unit, satu supir) ditegakkan saat mutasi supir di modul operasional."
        aside={
          <>
            <Badge tone="info" pill>
              nomor polisi + lambung
            </Badge>
            <Badge tone="neutral" pill>
              target KM di modul KPI
            </Badge>
          </>
        }
      />

      <UnitsPanel />
    </>
  );
}