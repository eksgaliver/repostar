"use client";

import { useEffect, useState } from "react";
import { Alert } from "@/components/arc/alert/alert";
import { Badge } from "@/components/arc/badge/badge";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/arc/skeleton/skeleton";
import { Muted, Table } from "@/components/ui/Table";
import { apiFetch, copyFor } from "@/lib/api";
import { departments, regions } from "@/lib/sample";

interface WmplRegion {
  id: string;
  code: string;
  name: string;
  timezone: string;
  isActive: boolean;
  branches: { id: string; code: string; name: string; timezone: string; isOperational: boolean }[];
}

interface WmplPayload {
  company: {
    id: string;
    code: string;
    name: string;
    legalName: string | null;
    defaultTimezone: string;
    isActive: boolean;
  };
  regions: WmplRegion[];
  departments: { id: string; code: string; name: string }[];
  headcount: { total: number; staff: number; drivers: number; mechanics: number };
  fleet: { total: number; active: number; tas: number; regionsCovered: number };
  operations: {
    date: string;
    totalKm: number;
    workingUnits: number;
    standby: number;
    workshop: number;
    deliveryOrders: number;
    requestedUnits: number;
    pendingOa: number;
  };
  bulletins: { id: string; title: string; body: string; publishedAt: string | null }[];
  generatedAt: string;
}

/** Mirrors the API payload so the page is reviewable without Postgres. */
const FALLBACK: WmplPayload = {
  company: {
    id: "demo",
    code: "WMPL",
    name: "WMPL",
    legalName: "Wijaya Manggala Premier Lestari",
    defaultTimezone: "Asia/Jakarta",
    isActive: true,
  },
  regions: regions.map((region, index) => ({
    id: `region-${region.code}`,
    code: region.code,
    name: region.name,
    timezone: region.timezone,
    isActive: true,
    branches: region.branches.map((branch, branchIndex) => ({
      id: `branch-${index}-${branchIndex}`,
      code: branch.slice(0, 3).toUpperCase(),
      name: branch,
      timezone: region.timezone,
      isOperational: true,
    })),
  })),
  departments: departments.map((name, index) => ({
    id: `dept-${index}`,
    code: name.slice(0, 3).toUpperCase(),
    name,
  })),
  headcount: { total: 128, staff: 74, drivers: 42, mechanics: 12 },
  fleet: { total: 42, active: 38, tas: 4, regionsCovered: 4 },
  operations: {
    date: new Date().toISOString().slice(0, 10),
    totalKm: 5940,
    workingUnits: 38,
    standby: 3,
    workshop: 2,
    deliveryOrders: 3,
    requestedUnits: 13,
    pendingOa: 1,
  },
  bulletins: [
    {
      id: "bulletin-1",
      title: "Cutoff November ditutup tanggal 25",
      body: "Pastikan seluruh status matriks tanggal 1–25 sudah terisi sebelum cutoff dikunci HRD.",
      publishedAt: new Date().toISOString(),
    },
  ],
  generatedAt: new Date().toISOString(),
};

function Tile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div
      className="flex flex-col gap-1 rounded-2xl border p-4"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <span className="text-[11px] uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <span className="text-xl font-semibold tracking-tight">{value}</span>
      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
        {hint}
      </span>
    </div>
  );
}

export function WmplWorkspace() {
  const [data, setData] = useState<WmplPayload | null>(null);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    apiFetch<WmplPayload>("/company/wmpl")
      .then((payload) => {
        if (alive) setData(payload);
      })
      .catch((caught) => {
        if (!alive) return;
        setOffline(true);
        setError(copyFor(caught));
        setData(FALLBACK);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!data) {
    return (
      <Card title="Memuat workspace WMPL" description="Mengambil GET /company/wmpl." meta="Company" status="…">
        <Skeleton lines={5} avatar />
      </Card>
    );
  }

  const { company, headcount, fleet, operations } = data;

  return (
    <>
      {offline ? (
        <Alert tone="warning" title="Mode contoh" open>
          {error} Menampilkan data contoh sampai <code>erp-backend-api</code> berjalan.
        </Alert>
      ) : null}

      <Card
        title={company.legalName ?? company.name}
        description={`Kode ${company.code} · timezone default ${company.defaultTimezone} · ${data.regions.length} wilayah · ${data.departments.length} departemen`}
        meta="Multi-company"
        status={company.isActive ? "Aktif" : "Nonaktif"}
        action={
          <Badge tone="success" dot pill>
            WMPL
          </Badge>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Tile label="Karyawan aktif" value={String(headcount.total)} hint={`${headcount.staff} staff · ${headcount.drivers} supir · ${headcount.mechanics} mekanik`} />
          <Tile label="Armada" value={`${fleet.active}/${fleet.total}`} hint={`${fleet.tas} unit TAS · ${fleet.regionsCovered} wilayah`} />
          <Tile label="KM hari ini" value={operations.totalKm.toLocaleString("id-ID")} hint={`${operations.workingUnits} unit bekerja · ${operations.standby} standby`} />
          <Tile label="Permintaan DO" value={`${operations.requestedUnits} unit`} hint={`${operations.deliveryOrders} DO · ${operations.pendingOa} menunggu OA`} />
        </div>
      </Card>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card
          title="Wilayah & cabang operasional"
          description="Setiap cabang membawa timezone lokasinya sendiri; absensi mengikuti zona lokasi, bukan perangkat."
          meta="Master data"
          status={`${data.regions.length} wilayah`}
        >
          <Table
            head={["Kode", "Wilayah", "Timezone", "Cabang"]}
            rows={data.regions.map((region) => [
              <strong key={`${region.code}-code`}>{region.code}</strong>,
              region.name,
              <Muted key={`${region.code}-tz`}>{region.timezone}</Muted>,
              region.branches.map((branch) => branch.name).join(" · ") || "—",
            ])}
          />
        </Card>

        <Card
          title="Operasional hari ini"
          description={`Rekap ${operations.date} untuk seluruh unit WMPL.`}
          meta="Operations"
          status="live"
        >
          <div className="flex flex-col gap-3 text-sm">
            {[
              ["Unit bekerja", `${operations.workingUnits} unit`],
              ["Standby (S.T)", `${operations.standby} unit`],
              ["Perbaikan (NUP/NUPL)", `${operations.workshop} unit`],
              ["DO masuk", `${operations.deliveryOrders} dokumen`],
              ["Menunggu OA", `${operations.pendingOa} DO`],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                <span className="font-medium tabular-nums">{value}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card
        title="Departemen"
        description="Sebelas divisi bawaan WMPL; setiap divisi punya Kepala Divisi dan Staff."
        meta="Organisasi"
        status={`${data.departments.length} divisi`}
      >
        <div className="flex flex-wrap gap-2">
          {data.departments.map((department) => (
            <Badge key={department.id} size="sm" pill>
              {department.name}
            </Badge>
          ))}
        </div>
      </Card>

      <Card
        title="Internal bulletin"
        description="Posting Kepala Divisi tayang setelah disetujui HRD."
        meta="HRIS"
        status={`${data.bulletins.length} tayang`}
      >
        {data.bulletins.length ? (
          <ul className="flex flex-col gap-3 text-sm">
            {data.bulletins.map((bulletin) => (
              <li key={bulletin.id} className="flex flex-col gap-1">
                <span className="font-medium">{bulletin.title}</span>
                <span style={{ color: "var(--text-secondary)" }}>{bulletin.body}</span>
                {bulletin.publishedAt ? <Muted>{new Date(bulletin.publishedAt).toLocaleString("id-ID")}</Muted> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Belum ada bulletin yang tayang.
          </p>
        )}
      </Card>
    </>
  );
}