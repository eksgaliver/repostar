"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { CompanyLogo } from "@/components/company/CompanyLogo";
import { provinces, timezoneShortName, timezonesOf, zoneLabel } from "@/components/company/region-data";
import { Muted } from "@/components/ui/Table";
import { draftFrom, fetchCompany, fetchRegionsByCompany } from "@/lib/company";
import type { CompanyRow, RegionRow } from "@/lib/company";

/** Detail: read-only. Editing and deleting keep their own routes. */
export function CompanyDetailView({ companyId }: { companyId: string }) {
  const [row, setRow] = useState<CompanyRow | null>(null);
  const [regions, setRegions] = useState<RegionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([fetchCompany(companyId), fetchRegionsByCompany()]).then(([company, grouped]) => {
      if (!alive) return;
      setRow(company.row);
      setRegions(company.row ? grouped.get(company.row.id) ?? [] : []);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [companyId]);

  if (loading) {
    return <Muted>Memuat detail perusahaan…</Muted>;
  }

  if (!row) {
    return (
      <EmptyState
        title="Perusahaan tidak ditemukan"
        description={`Tidak ada tenant dengan id ${companyId}. Kembali ke daftar untuk memilih yang lain.`}
        action={
          <Link href="/perusahaan">
            <Button variant="secondary">Kembali ke daftar</Button>
          </Link>
        }
      />
    );
  }

  const draft = draftFrom(row);
  const provinceNames = provinces
    .filter((province) => draft.provinceIds.includes(province.id))
    .map((province) => province.name);
  const zones = regions.length
    ? [...new Set(regions.map((region) => zoneLabel(region.timezone)))]
    : timezonesOf(draft.provinceIds).map(timezoneShortName);
  const cutoffEnd = draft.cutoffDay === 1 ? 31 : draft.cutoffDay - 1;

  return (
    <div className="detail-shell">
      <section className="detail-hero">
        <div className="detail-hero__logo">
          <CompanyLogo name={row.name} src={draft.logo} size={96} hero />
        </div>

        <div className="detail-hero__body">
          <h1 className="detail-hero__name">{row.name}</h1>
          <span className="detail-hero__legal">{row.legalName ?? "Nama legal belum diisi"}</span>
          <div className="detail-hero__chips">
            <span className="detail-chip">
              <code>{row.code}</code>
            </span>
            <Badge tone={row.isActive === false ? "neutral" : "success"} size="sm" dot>
              {row.isActive === false ? "nonaktif" : "aktif"}
            </Badge>
            {zones.map((zone) => (
              <span key={zone} className="detail-chip">
                {zone}
              </span>
            ))}
          </div>
        </div>

        <div className="detail-hero__actions">
          <Link href="/perusahaan">
            <Button size="sm" variant="ghost">
              Kembali
            </Button>
          </Link>
          <Link href={`/perusahaan/${row.id}/edit`}>
            <Button size="sm" variant="secondary">
              Ubah
            </Button>
          </Link>
          <Link href={`/perusahaan/${row.id}/delete`}>
            <Button size="sm" variant="danger">
              Hapus
            </Button>
          </Link>
        </div>
      </section>

      <div className="detail-metrics">
        <div className="detail-metric">
          <span className="detail-metric__label">Wilayah tersimpan</span>
          <span className="detail-metric__value">{regions.length}</span>
          <span className="detail-metric__hint">
            {regions.length ? regions.map((region) => region.name).join(", ") : "Belum ada wilayah"}
          </span>
        </div>

        <div className="detail-metric">
          <span className="detail-metric__label">Sub wilayah</span>
          <span className="detail-metric__value">{draft.regencyIds.length}</span>
          <span className="detail-metric__hint">kabupaten/kota pada draf sesi</span>
        </div>

        <div className="detail-metric">
          <span className="detail-metric__label">Cutoff absensi</span>
          <span className="detail-metric__value">
            {draft.cutoffDay} – {cutoffEnd}
          </span>
          <span className="detail-metric__hint">tanggal mulai sampai akhir siklus</span>
        </div>

        <div className="detail-metric">
          <span className="detail-metric__label">Warna brand</span>
          <span className="detail-metric__value">
            <i className="detail-swatch" style={{ background: draft.primary }} aria-hidden="true" />
            <i className="detail-swatch" style={{ background: draft.secondary }} aria-hidden="true" />
          </span>
          <span className="detail-metric__hint">
            {draft.primary} · {draft.secondary}
          </span>
        </div>
      </div>

      <div className="detail-grid">
        <section className="detail-panel">
          <div className="detail-panel__head">
            <h2 className="detail-panel__title">Profil tenant</h2>
            <Muted>dari erp-backend-api</Muted>
          </div>
          <ul className="list-rows">
            <li className="flex items-center justify-between gap-3">
              <span>Kode</span>
              <strong>{row.code}</strong>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Nama singkat</span>
              <span>{row.name}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Nama legal</span>
              <span>{row.legalName ?? "—"}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Zona waktu default</span>
              <span>{row.defaultTimezone}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Status</span>
              <Badge size="sm" dot tone={row.isActive === false ? "neutral" : "success"}>
                {row.isActive === false ? "nonaktif" : "aktif"}
              </Badge>
            </li>
          </ul>
        </section>

        <section className="detail-panel">
          <div className="detail-panel__head">
            <h2 className="detail-panel__title">Wilayah operasional</h2>
            <Link href="/perusahaan/regions">
              <Button size="sm" variant="ghost">
                Kelola
              </Button>
            </Link>
          </div>

          {regions.length ? (
            <div className="detail-chips">
              {regions.map((region) => (
                <span key={region.id} className="detail-chip">
                  {region.name}
                  <code>{region.code}</code>
                </span>
              ))}
            </div>
          ) : provinceNames.length ? (
            <div className="detail-chips">
              {provinceNames.map((province) => (
                <span key={province} className="detail-chip">
                  {province}
                </span>
              ))}
            </div>
          ) : (
            <Muted>Belum ada wilayah. Tambahkan lewat halaman Wilayah &amp; cabang.</Muted>
          )}

          <p style={{ marginTop: 12, marginBottom: 0 }}>
            <Muted>
              Warna brand, sub wilayah, dan cutoff berasal dari draf sesi ini. Belum ada kolomnya di skema,
              jadi nilainya hilang saat halaman dimuat ulang.
            </Muted>
          </p>
        </section>
      </div>
    </div>
  );
}