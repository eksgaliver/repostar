import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { WilayahPanels } from "@/components/admin/WilayahPanels";
import { PageHeader } from "@/components/ui/Table";

export const metadata: Metadata = { title: "Wilayah & cabang · S.T.A.R.S" };

/** Wilayah and cabang registry, kept apart from the company views. */
export default function RegionsPage() {
  return (
    <>
      <PageHeader
        title="Wilayah & cabang"
        description="Wilayah menetapkan zona waktu absensi dan awalan kode karyawan; cabang adalah pool operasional di bawahnya."
        aside={
          <>
            <Badge tone="info" pill>
              awalan ID karyawan
            </Badge>
            <Link href="/perusahaan">
              <Button size="sm" variant="secondary">
                Kembali ke perusahaan
              </Button>
            </Link>
          </>
        }
      />

      <WilayahPanels />
    </>
  );
}