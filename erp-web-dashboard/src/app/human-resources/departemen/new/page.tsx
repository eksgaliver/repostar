import type { Metadata } from "next";
import { DepartmentForm } from "@/components/departments/DepartmentForm";
import { PageHeader } from "@/components/ui/Table";

export const metadata: Metadata = { title: "Departemen baru · S.T.A.R.S" };

/** Create: code, name, and status. */
export default function NewDepartmentPage() {
  return (
    <>
      <PageHeader
        title="Departemen baru"
        description="Departemen dipakai sebagai posisi karyawan dan dasar laporan per divisi."
      />

      <DepartmentForm mode="create" />
    </>
  );
}