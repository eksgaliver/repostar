"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert } from "@/components/arc/alert/alert";
import { Button } from "@/components/arc/button/button";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { Card } from "@/components/ui/Card";
import { Muted, PageHeader } from "@/components/ui/Table";
import { SignaturePad } from "@/components/documents/SignaturePad";
import { useBreadcrumbTrail } from "@/lib/breadcrumbs";
import { documentTypeLabel, fetchDocument, signDocumentAs } from "@/lib/documents";
import type { DocumentRow } from "@/lib/documents";

/**
 * The requested user signs here. Only the account named on the letter may
 * complete it (the API enforces that), and signing sends it immediately.
 */
export function DocumentSign({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [document, setDocument] = useState<DocumentRow | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useBreadcrumbTrail(document ? [document.title, "Tanda tangan"] : []);

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

  async function submit() {
    if (!signature) {
      setError("Gambar tanda tangan dulu sebelum mengirim.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const signed = await signDocumentAs(documentId, signature);
      router.push(`/komunikasi/dokumen/${signed.id}`);
    } catch (caught) {
      const code = (caught as { code?: string }).code;
      setError(
        code === "not_requested_signer"
          ? "Surat ini diminta untuk user lain, jadi hanya akun itu yang bisa menandatangani."
          : caught instanceof Error
            ? caught.message
            : "Gagal menyimpan tanda tangan."
      );
      setBusy(false);
    }
  }

  if (loading) {
    return <Muted>Memuat permintaan tanda tangan…</Muted>;
  }

  if (!document || document.status !== "pending") {
    return (
      <EmptyState
        title="Tidak ada permintaan tanda tangan"
        description={
          error ?? "Surat ini tidak sedang menunggu tanda tangan, atau sudah ditandatangani."
        }
        action={
          <Link href={`/komunikasi/dokumen/${documentId}`}>
            <Button variant="secondary">Lihat surat</Button>
          </Link>
        }
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Tanda tangan surat"
        description={`${document.title} · ${document.number}`}
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
        description={`Diminta untuk ${document.signerName ?? "—"} · ${document.signerTitle ?? documentTypeLabel(document.type)}`}
        meta="Menunggu tanda tangan"
        status={documentTypeLabel(document.type)}
      >
        <div className="doc-sign">
          <SignaturePad value={signature} onChange={setSignature} height={180} />
        </div>

        <div className="doc-actions">
          <Button onClick={submit} loading={busy} disabled={busy || !signature}>
            Tanda tangan &amp; kirim
          </Button>
        </div>
      </Card>
    </>
  );
}