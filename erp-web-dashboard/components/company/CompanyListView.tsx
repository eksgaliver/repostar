"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { SearchField } from "@/components/arc/search-field/search-field";
import { CompanyCard } from "@/components/company/CompanyCard";
import { Muted } from "@/components/ui/Table";
import { fetchCompanies, readDraft } from "@/lib/company";
import type { CompanyRow } from "@/lib/company";

interface CompanyEntry {
  row: CompanyRow;
  logo?: string;
  colors?: { primary: string; secondary: string };
}

/**
 * View: one tile per tenant, with a search field that narrows by code, short
 * name, or legal name. Everything else about a tenant lives on its own page.
 */
export function CompanyListView() {
  const [entries, setEntries] = useState<CompanyEntry[] | null>(null);
  const [fromSample, setFromSample] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    fetchCompanies().then((companies) => {
      if (!alive) return;
      setFromSample(companies.fromSample);
      setEntries(
        companies.rows.map((row) => {
          const draft = readDraft(row.id);
          return {
            row,
            logo: draft?.logo,
            colors: draft ? { primary: draft.primary, secondary: draft.secondary } : undefined,
          };
        })
      );
    });
    return () => {
      alive = false;
    };
  }, []);

  const visible = useMemo(() => {
    const list = entries ?? [];
    const needle = query.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((entry) =>
      `${entry.row.code} ${entry.row.name} ${entry.row.legalName ?? ""}`.toLowerCase().includes(needle)
    );
  }, [entries, query]);

  if (entries === null) {
    return <Muted>Memuat daftar perusahaan…</Muted>;
  }

  if (!entries.length) {
    return (
      <EmptyState
        title="Belum ada perusahaan"
        description="Tambahkan tenant pertama untuk memulai wilayah, cabang, dan siklus absensi."
        action={
          <Link href="/perusahaan/new">
            <Button>Perusahaan baru</Button>
          </Link>
        }
      />
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-full sm:w-80">
          <SearchField
            label="Cari perusahaan"
            placeholder="Kode atau nama perusahaan…"
            value={query}
            onValueChange={setQuery}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Muted>{visible.length} dari {entries.length} perusahaan</Muted>
          {fromSample ? (
            <Badge tone="warning" size="sm" dot>
              data contoh, API belum tersambung
            </Badge>
          ) : null}
        </div>
      </div>

      {visible.length ? (
        <div className="brand-grid">
          {visible.map((entry) => (
            <CompanyCard
              key={entry.row.id}
              company={entry.row}
              logo={entry.logo}
              colors={entry.colors}
            />
          ))}
        </div>
      ) : (
        <Muted>Tidak ada perusahaan yang cocok dengan “{query.trim()}”.</Muted>
      )}
    </section>
  );
}