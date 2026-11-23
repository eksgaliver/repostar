"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert } from "@/components/arc/alert/alert";
import { Button } from "@/components/arc/button/button";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { HoldToConfirm } from "@/components/arc/hold-to-confirm/hold-to-confirm";
import { Card } from "@/components/ui/Card";
import { Muted, PageHeader, StatRow } from "@/components/ui/Table";
import { useBreadcrumbTrail } from "@/lib/breadcrumbs";
import {
  deleteDocument,
  documentTypeLabel,
  fetchDocument,
  formatDocumentDate,
} from "@/lib/documents";
import type { DocumentRow } from "@/lib/documents";
import { canAuthor } from "@/lib/roles";
import { useRole } from "@/lib/role-store";

/**
 * Delete is its own route, like every other CRUD view here. The letter is shown
 * once more before the hold-to-confirm, so nobody removes the wrong document.
 */
export function DocumentDelete({ documentId }: { documentId: string }) {
  const router = useRouter();
  const role = useRole();
  const [document, setDocument] = useState<DocumentRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useBreadcrumbTrail(document ? [document.title, "Hapus"] : []);

  useEffect(() => {
    let alive = true;
    fetchDocument(documentId)
      .then((row) => {
        if (alive) setDocument(row);
      })
      .catch((caught: unknown) => {
        if (alive) setError(caught instanceof Error ? caught.message : "Gagal memuat surat.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [documentId]);

  async function remove() {
    try {
      await deleteDocument(documentId);
      router.push("/komunikasi/dokumen");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menghapus surat.");
    }
  }

  if (loading) {
    return <Muted>Memuat surat…</Muted>;
  }

  if (!document || !canAuthor(role)) {
    return (
      <EmptyState
        title="Surat tidak bisa dihapus"
        description={error ?? "Surat ini tidak ditemukan atau bukan milik tenant aktif."}
        action={
          <Link href="/komunikasi/dokumen">
            <Button variant="secondary">Kembali ke dokumen</Button>
          </Link>
        }
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Hapus surat"
        description="Surat dan tanda tangannya dihapus permanen. Nomor tidak dipakai ulang."
        aside={
          <Link href={`/komunikasi/dokumen/${document.id}`}>
            <Button size="sm" variant="secondary">
              Batal
            </Button>
          </Link>
        }
      />

      {error ? <Alert tone="danger" title={error} /> : null}

      <Card
        title={document.title}
        description="Periksa nomor dan tanggal sebelum menahan tombol hapus."
        meta="Tidak bisa dibatalkan"
        status={documentTypeLabel(document.type)}
      >
        <StatRow label="Nomor" value={document.number} />
        <StatRow label="Tanggal" value={formatDocumentDate(document.sentAt ?? document.createdAt)} />
        <StatRow label="Status" value={document.status === "sent" ? "terkirim" : "draf"} />

        <HoldToConfirm
          label="Tahan untuk hapus surat"
          confirmedLabel="Surat dihapus"
          duration={1200}
          tone="danger"
          onConfirm={remove}
        />
      </Card>
    </>
  );
}