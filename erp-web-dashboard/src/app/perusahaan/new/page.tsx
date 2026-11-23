import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/arc/button/button";
import { CompanySetupWizard } from "@/components/company/CompanySetupWizard";
import { PageHeader } from "@/components/ui/Table";

export const metadata: Metadata = { title: "Perusahaan baru · S.T.A.R.S" };

/** Create: wizard only, entered from the list. */
export default function NewCompanyPage() {
  return (
    <>
      <PageHeader
        title="Perusahaan baru"
        description="Empat langkah: profil tenant, warna brand, wilayah operasional, lalu cutoff absensi beserta sub wilayahnya."
        aside={
          <Link href="/perusahaan">
            <Button size="sm" variant="secondary">
              Batal
            </Button>
          </Link>
        }
      />

      <CompanySetupWizard mode="create" />
    </>
  );
}