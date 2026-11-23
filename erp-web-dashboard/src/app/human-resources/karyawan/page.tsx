import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/arc/button/button";
import { EmployeeDirectory } from "@/components/people/EmployeeDirectory";
import { PageHeader } from "@/components/ui/Table";

export const metadata: Metadata = { title: "Karyawan · S.T.A.R.S" };

/**
 * HR employee list. Creation, detail and resign each keep their own route, so
 * this page only lists and filters.
 */
export default function KaryawanPage() {
  return (
    <>
      <PageHeader
        title="Karyawan"
        description="Biodata dan akun login dikelola terpisah: HR mengisi keduanya saat onboarding, lalu status dan kontrak dirawat dari halaman detail."
        aside={
          <Link href="/human-resources/karyawan/new">
            <Button size="sm">Karyawan baru</Button>
          </Link>
        }
      />

      <EmployeeDirectory />
    </>
  );
}