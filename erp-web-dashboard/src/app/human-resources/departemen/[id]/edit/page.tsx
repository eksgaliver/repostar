import type { Metadata } from "next";
import { DepartmentEditor } from "@/components/departments/DepartmentEditor";
import { PageHeader } from "@/components/ui/Table";

export const metadata: Metadata = { title: "Ubah departemen · S.T.A.R.S" };

/** Same placeholder as the detail route; real ids render on demand. */
export function generateStaticParams(): { id: string }[] {
  return [{ id: "contoh" }];
}

/** Update: same fields as create, prefilled from the stored department. */
export default async function EditDepartmentPage(props: PageProps<"/human-resources/departemen/[id]/edit">) {
  const { id } = await props.params;
  return (
    <>
      <PageHeader
        title="Ubah departemen"
        description="Perubahan kode langsung terlihat di daftar karyawan dan laporan."
      />

      <DepartmentEditor departmentId={id} />
    </>
  );
}