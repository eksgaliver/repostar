import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/arc/button/button";
import { CompanyListView } from "@/components/company/CompanyListView";
import { PageHeader } from "@/components/ui/Table";

export const metadata: Metadata = { title: "Perusahaan · S.T.A.R.S" };

/** View: daftar tenant. Detail, tambah, ubah, dan hapus punya route sendiri. */
export default function PerusahaanPage() {
  return (
    <>
      <PageHeader
        title="Perusahaan"
        description="Setiap kartu adalah satu perusahaan. Buka kartu untuk detail, atau tambah perusahaan baru."
        aside={
          <Link href="/perusahaan/new">
            <Button size="sm">Perusahaan baru</Button>
          </Link>
        }
      />

      <CompanyListView />
    </>
  );
}