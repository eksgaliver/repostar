"use client";

import { Badge } from "@/components/arc/badge/badge";
import { ResourcePanel } from "@/components/admin/ResourcePanel";

/** PRD A.5: fleet registry (plate, hull/year, spec, region, Korlap). */
export function UnitsPanel() {
  return (
    <ResourcePanel
      title="Unit"
      description="Identitas armada. Korlap dipilih dari karyawan aktif divisi operasional."
      meta="Fleet"
      endpoint="/operations/units"
      listKey="units"
      addLabel="Tambah unit"
      fields={[
        {
          name: "companyId",
          label: "Perusahaan",
          kind: "select",
          required: true,
          optionsFrom: { endpoint: "/master/companies", listKey: "companies", label: (row) => `${row.code} · ${row.name}` },
        },
        {
          name: "regionId",
          label: "Wilayah",
          kind: "select",
          required: true,
          optionsFrom: { endpoint: "/master/regions", listKey: "regions", label: (row) => `${row.code} · ${row.name}` },
        },
        { name: "plateNumber", label: "Nomor polisi", required: true, placeholder: "BM 8842 RA" },
        { name: "brand", label: "Merek", placeholder: "Hino" },
        { name: "model", label: "Model", placeholder: "FM 260 JD" },
        { name: "year", label: "Tahun", kind: "number", placeholder: "2021" },
        { name: "specification", label: "Spesifikasi bak/tangki", placeholder: "Dump Truck" },
        {
          name: "korlapId",
          label: "Korlap",
          kind: "select",
          optionsFrom: { endpoint: "/people/employees", listKey: "employees", label: (row) => `${row.employeeCode} · ${row.fullName}` },
        },
      ]}
      columns={[
        {
          header: "Unit",
          cell: (row) => (
            <span>
              <span className="block font-medium">{String(row.plateNumber)}</span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {String(row.brand ?? "—")} {String(row.model ?? "")}
              </span>
            </span>
          ),
        },
        { header: "Tahun", cell: (row) => <span className="tabular-nums">{String(row.year ?? "—")}</span> },
        { header: "Spesifikasi", cell: (row) => <span className="text-xs">{String(row.specification ?? "—")}</span> },
        {
          header: "Status",
          cell: (row) => (
            <Badge size="sm" dot tone={row.status === "active" ? "success" : "warning"}>
              {String(row.status)}
            </Badge>
          ),
        },
      ]}
    />
  );
}