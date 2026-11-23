import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/arc/button/button";
import { CompanyEditor } from "@/components/company/CompanyEditor";
import { sampleCompanies } from "@/lib/company";
import { PageHeader } from "@/components/ui/Table";

export const metadata: Metadata = { title: "Ubah perusahaan · S.T.A.R.S" };

/** Same prerender hint as the detail route: the shell needs a known path. */
export function generateStaticParams() {
  return sampleCompanies.map((company) => ({ id: company.id }));
}

/** Update: the same steps as create, started from the stored tenant. */
export default async function EditCompanyPage(props: PageProps<"/perusahaan/[id]/edit">) {
  const { id } = await props.params;
  return (
    <>
      <PageHeader
        title="Ubah perusahaan"
        description="Langkah yang sama dengan pendaftaran. Perubahan warna, wilayah, dan cutoff masih tersimpan sebagai draf sesi."
        aside={
          <Link href={`/perusahaan/${id}`}>
            <Button size="sm" variant="secondary">
              Batal
            </Button>
          </Link>
        }
      />

      <CompanyEditor companyId={id} />
    </>
  );
}