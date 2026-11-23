import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/arc/button/button";
import { DepartmentDirectory } from "@/components/departments/DepartmentDirectory";
import { PageHeader } from "@/components/ui/Table";

export const metadata: Metadata = { title: "Departemen · S.T.A.R.S" };

/** Department list: teams plus the members inside them. */
export default function DepartemenPage() {
  return (
    <>
      <PageHeader
        title="Departemen"
        description="Setiap departemen menampung karyawan dan menjadi pilihan posisi saat onboarding. Avatar bertumpuk menunjukkan siapa saja anggotanya."
        aside={
          <Link href="/human-resources/departemen/new">
            <Button size="sm">Departemen baru</Button>
          </Link>
        }
      />

      <DepartmentDirectory />
    </>
  );
}