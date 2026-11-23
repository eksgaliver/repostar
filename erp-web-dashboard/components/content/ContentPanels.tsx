"use client";

import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { ResourcePanel } from "@/components/admin/ResourcePanel";
import { apiFetch } from "@/lib/api";

const conditions = [
  { id: "good", label: "Baik" },
  { id: "fair", label: "Cukup" },
  { id: "damaged", label: "Rusak" },
];

/** PRD C.4 - asset hand-over registry + internal bulletin with HRD approval. */
export function ContentPanels() {
  return (
    <>
      <ResourcePanel
        title="Inventaris aset"
        description="Serah terima aset (laptop, HP operasional, seragam, APD, peralatan kerja) beserta kondisi dan pemegangnya."
        meta="Inventaris"
        endpoint="/content/assets"
        listKey="assets"
        addLabel="Tambah aset"
        fields={[
          {
            name: "companyId",
            label: "Perusahaan",
            kind: "select",
            required: true,
            optionsFrom: { endpoint: "/master/companies", listKey: "companies", label: (row) => `${row.code} · ${row.name}` },
          },
          { name: "code", label: "Kode aset", required: true, placeholder: "AST-HP-001" },
          { name: "name", label: "Nama aset", required: true },
          { name: "category", label: "Kategori", placeholder: "Elektronik" },
          { name: "serialNumber", label: "Nomor seri" },
          { name: "condition", label: "Kondisi", kind: "select", options: conditions, defaultValue: "good" },
          {
            name: "assignedEmployeeId",
            label: "Dipegang oleh",
            kind: "select",
            optionsFrom: { endpoint: "/people/employees", listKey: "employees", label: (row) => `${row.employeeCode} · ${row.fullName}` },
          },
          { name: "notes", label: "Catatan" },
        ]}
        columns={[
          { header: "Kode", cell: (row) => <code className="text-xs">{String(row.code)}</code> },
          {
            header: "Aset",
            cell: (row) => (
              <span>
                <span className="block font-medium">{String(row.name)}</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {String(row.category ?? "—")}
                </span>
              </span>
            ),
          },
          {
            header: "Kondisi",
            cell: (row) => (
              <Badge size="sm" dot tone={row.condition === "good" ? "success" : row.condition === "fair" ? "warning" : "danger"}>
                {String(row.condition)}
              </Badge>
            ),
          },
          {
            header: "Pemegang",
            cell: (row) => (
              <span className="text-xs">{row.assignedEmployeeId ? "ditugaskan" : "belum"}</span>
            ),
          },
        ]}
      />

      <ResourcePanel
        title="Internal bulletin"
        description="Kepala Divisi membuat draf; tayang di aplikasi karyawan setelah disetujui Admin HR."
        meta="Broadcast"
        endpoint="/content/bulletins"
        listKey="bulletins"
        addLabel="Buat bulletin"
        fields={[
          {
            name: "companyId",
            label: "Perusahaan",
            kind: "select",
            required: true,
            optionsFrom: { endpoint: "/master/companies", listKey: "companies", label: (row) => `${row.code} · ${row.name}` },
          },
          { name: "title", label: "Judul", required: true },
          { name: "body", label: "Isi pengumuman", required: true },
        ]}
        columns={[
          {
            header: "Judul",
            cell: (row) => (
              <span>
                <span className="block font-medium">{String(row.title)}</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {String(row.body).slice(0, 80)}
                </span>
              </span>
            ),
          },
          {
            header: "Status",
            cell: (row) => (
              <Badge
                size="sm"
                dot
                tone={row.status === "published" ? "success" : row.status === "rejected" ? "danger" : "warning"}
              >
                {String(row.status)}
              </Badge>
            ),
          },
          {
            header: "Tayang",
            cell: (row) => (
              <span className="text-xs">
                {row.publishedAt ? new Date(String(row.publishedAt)).toLocaleDateString("id-ID") : "—"}
              </span>
            ),
          },
        ]}
        rowActions={(row, reload) =>
          row.status === "pending" ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                await apiFetch(`/content/bulletins/${String(row.id)}/approve`, {
                  method: "POST",
                  body: JSON.stringify({ approved: true }),
                });
                reload();
              }}
            >
              Setujui
            </Button>
          ) : (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              —
            </span>
          )
        }
      />
    </>
  );
}