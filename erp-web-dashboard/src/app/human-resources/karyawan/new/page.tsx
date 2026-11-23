import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/arc/button/button";
import { EmployeeOnboard } from "@/components/people/EmployeeOnboard";
import { PageHeader } from "@/components/ui/Table";

export const metadata: Metadata = { title: "Karyawan baru · S.T.A.R.S" };

/** Create: two steps, akun login then biodata. */
export default function NewEmployeePage() {
  return (
    <>
      <PageHeader
        title="Karyawan baru"
        description="Langkah pertama membuat akun login, langkah kedua mengisi biodata dan penempatan. Akun memakai kata sandi awal onboarding."
        aside={
          <Link href="/human-resources/karyawan">
            <Button size="sm" variant="secondary">
              Batal
            </Button>
          </Link>
        }
      />

      <EmployeeOnboard />
    </>
  );
}