"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { Combobox } from "@/components/arc/combobox/combobox";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { SearchField } from "@/components/arc/search-field/search-field";
import SegmentedControl from "@/components/arc/segmented-control/segmented-control";
import { Card } from "@/components/ui/Card";
import { Muted } from "@/components/ui/Table";
import { resolveActiveCompany } from "@/lib/company";
import {
  DOCUMENT_TYPES,
  documentTypeLabel,
  fetchDocuments,
  formatDocumentDate,
} from "@/lib/documents";
import type { DocumentRow, DocumentStatusValue, DocumentTypeValue } from "@/lib/documents";
import { canAuthor } from "@/lib/roles";
import { useRole } from "@/lib/role-store";

const STATUS_TONE = { draft: "warning", pending: "info", sent: "success", archived: "neutral" } as const;
const STATUS_LABEL = { draft: "draf", pending: "menunggu", sent: "terkirim", archived: "arsip" } as const;

/**
 * The letter archive. Staff only sees what was already sent (the API enforces
 * that), so the status filter quietly drops the draft column for them.
 */
export function DocumentDirectory() {
  const role = useRole();
  const [companyCode, setCompanyCode] = useState("");
  const [rows, setRows] = useState<DocumentRow[] | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | DocumentStatusValue>("all");
  const [type, setType] = useState<"all" | DocumentTypeValue>("all");
  const [error, setError] = useState<string | null>(null);

  const allowed = canAuthor(role);

  useEffect(() => {
    let alive = true;
    (async () => {
      const company = await resolveActiveCompany();
      if (!alive) return;
      if (!company) {
        setRows([]);
        return;
      }
      setCompanyCode(company.code);
      try {
        const list = await fetchDocuments(company.id);
        if (alive) setRows(list);
      } catch (caught) {
        if (!alive) return;
        setRows([]);
        setError(caught instanceof Error ? caught.message : "Gagal memuat dokumen.");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (rows ?? []).filter((row) => {
      if (status !== "all" && row.status !== status) return false;
      if (type !== "all" && row.type !== type) return false;
      if (!needle) return true;
      return `${row.title} ${row.number} ${row.authorName ?? ""}`.toLowerCase().includes(needle);
    });
  }, [rows, query, status, type]);

  if (rows === null) {
    return <Muted>Memuat dokumen…</Muted>;
  }

  if (!rows.length) {
    return (
      <EmptyState
        title={error ? "Dokumen gagal dimuat" : "Belum ada surat"}
        description={
          error ?? "Surat yang ditulis akan muncul di sini, lengkap dengan nomor dan statusnya."
        }
        action={
          allowed ? (
            <Link href="/komunikasi/dokumen/new">
              <Button>Surat baru</Button>
            </Link>
          ) : null
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <SegmentedControl
            label="Filter status"
            options={[
              { value: "all", label: "Semua" },
              { value: "draft", label: "Draf" },
              { value: "pending", label: "Menunggu" },
              { value: "sent", label: "Terkirim" },
            ]}
            value={status}
            onValueChange={(value) => setStatus(value as typeof status)}
          />
          <div className="w-full sm:w-56">
            <Combobox
              label="Tipe surat"
              options={[
                { value: "all", label: "Semua tipe" },
                ...DOCUMENT_TYPES.map((option) => ({ value: option.value, label: option.label })),
              ]}
              value={type}
              onValueChange={(value) => setType(value as typeof type)}
            />
          </div>
        </div>
        <div className="w-full sm:w-80">
          <SearchField
            label="Cari dokumen"
            placeholder="Perihal, nomor, atau penulis…"
            value={query}
            onValueChange={setQuery}
          />
        </div>
      </div>

      <Card
        title="Dokumen perusahaan"
        description="Draf masih bisa diubah. Surat yang sudah dikirim terkunci beserta tanda tangannya."
        meta="Komunikasi"
        status={`${visible.length} dari ${rows.length} surat${companyCode ? ` · ${companyCode}` : ""}`}
      >
        <div className="doc-list">
          <div className="doc-row doc-row--head">
            <span>Dokumen</span>
            <span>Tanggal</span>
            <span>Status</span>
          </div>

          {visible.map((row) => (
            <Link key={row.id} href={`/komunikasi/dokumen/${row.id}`} className="doc-row">
              <span className="doc-row__text">
                <span className="doc-row__title">{row.title}</span>
                <span className="doc-row__meta">
                  {documentTypeLabel(row.type)} · {row.number} ·{" "}
                  {row.audienceType === "department"
                    ? row.audienceDepartmentName ?? "departemen"
                    : "semua karyawan"}
                </span>
              </span>
              <span className="emp-cell">{formatDocumentDate(row.sentAt ?? row.updatedAt)}</span>
              <span className="doc-row__status">
                <Badge size="sm" dot tone={STATUS_TONE[row.status]}>
                  {STATUS_LABEL[row.status]}
                </Badge>
              </span>
            </Link>
          ))}
        </div>

        {!visible.length ? (
          <p className="dept-empty">Tidak ada surat yang cocok dengan filter ini.</p>
        ) : null}
      </Card>
    </div>
  );
}