"use client";

import { Badge } from "@/components/arc/badge/badge";
import { ResourcePanel } from "@/components/admin/ResourcePanel";

const timezones = [
  { id: "Asia/Jakarta", label: "WIB · Asia/Jakarta" },
  { id: "Asia/Makassar", label: "WITA · Asia/Makassar" },
  { id: "Asia/Jayapura", label: "WIT · Asia/Jayapura" },
];

/**
 * PRD A.2. Wilayah and cabang management, moved off the company list so each
 * screen keeps one job. Tenants themselves are handled by the Perusahaan views.
 */
export function WilayahPanels() {
  return (
    <>
      <ResourcePanel
        title="Wilayah"
        description="Kode wilayah menjadi awalan ID karyawan (PK, KT, KH, KB) dan menentukan zona waktu absensi."
        meta="Master data"
        endpoint="/master/regions"
        listKey="regions"
        addLabel="Tambah wilayah"
        fields={[
          {
            name: "companyId",
            label: "Perusahaan",
            kind: "select",
            required: true,
            optionsFrom: { endpoint: "/master/companies", listKey: "companies", label: (row) => `${row.code} · ${row.name}` },
          },
          { name: "code", label: "Kode wilayah", required: true, placeholder: "PK" },
          { name: "name", label: "Nama wilayah", required: true, placeholder: "Riau" },
          { name: "timezone", label: "Timezone", kind: "select", options: timezones, defaultValue: "Asia/Jakarta" },
        ]}
        columns={[
          { header: "Kode", cell: (row) => <strong>{String(row.code)}</strong> },
          { header: "Wilayah", cell: (row) => String(row.name) },
          { header: "Timezone", cell: (row) => <span className="text-xs">{String(row.timezone)}</span> },
        ]}
      />

      <ResourcePanel
        title="Cabang operasional"
        description="Pool/cabang di bawah wilayah. Satu wilayah bisa punya beberapa cabang dengan timezone yang sama."
        meta="Master data"
        endpoint="/master/branches"
        listKey="branches"
        addLabel="Tambah cabang"
        fields={[
          {
            name: "regionId",
            label: "Wilayah",
            kind: "select",
            required: true,
            optionsFrom: { endpoint: "/master/regions", listKey: "regions", label: (row) => `${row.code} · ${row.name}` },
          },
          { name: "code", label: "Kode cabang", required: true, placeholder: "PKU" },
          { name: "name", label: "Nama cabang", required: true, placeholder: "Pekanbaru" },
          { name: "address", label: "Alamat" },
          { name: "timezone", label: "Timezone", kind: "select", options: timezones, defaultValue: "Asia/Jakarta" },
        ]}
        columns={[
          { header: "Kode", cell: (row) => <strong>{String(row.code)}</strong> },
          { header: "Cabang", cell: (row) => String(row.name) },
          { header: "Alamat", cell: (row) => <span className="text-xs">{String(row.address ?? "—")}</span> },
          { header: "Timezone", cell: (row) => <span className="text-xs">{String(row.timezone)}</span> },
          {
            header: "Status",
            cell: (row) => (
              <Badge size="sm" dot tone={row.isOperational === false ? "neutral" : "success"}>
                {row.isOperational === false ? "nonaktif" : "operasional"}
              </Badge>
            ),
          },
        ]}
      />
    </>
  );
}