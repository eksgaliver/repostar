"use client";

import { Badge } from "@/components/arc/badge/badge";
import { ResourcePanel } from "@/components/admin/ResourcePanel";
import { ShiftEditor } from "@/components/admin/ShiftEditor";

/** PRD A.3-A.4: departments, role hierarchy data, and per-day shift editor. */
export function StructurePanels() {
  return (
    <>
      <ResourcePanel
        title="Departemen"
        description="Sebelas divisi bawaan WMPL. Kode dipakai pada laporan dan penomoran."
        meta="Organisasi"
        endpoint="/master/departments"
        listKey="departments"
        addLabel="Tambah departemen"
        fields={[
          {
            name: "companyId",
            label: "Perusahaan",
            kind: "select",
            required: true,
            optionsFrom: { endpoint: "/master/companies", listKey: "companies", label: (row) => `${row.code} · ${row.name}` },
          },
          { name: "code", label: "Kode", required: true, placeholder: "OPS" },
          { name: "name", label: "Nama divisi", required: true, placeholder: "Operasional" },
        ]}
        columns={[
          { header: "Kode", cell: (row) => <strong>{String(row.code)}</strong> },
          { header: "Divisi", cell: (row) => String(row.name) },
          {
            header: "Status",
            cell: (row) => (
              <Badge size="sm" dot tone={row.isActive ? "success" : "neutral"}>
                {row.isActive ? "aktif" : "nonaktif"}
              </Badge>
            ),
          },
        ]}
      />

      <ShiftEditor />
    </>
  );
}