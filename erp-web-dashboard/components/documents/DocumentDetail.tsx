"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/arc/alert/alert";
import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { Card } from "@/components/ui/Card";
import { Muted, PageHeader, StatRow } from "@/components/ui/Table";
import { formatFileSize } from "@/components/arc/file-dropzone/file-dropzone";
import { DocumentPaper } from "@/components/documents/DocumentPaper";
import { PresenceCursors } from "@/components/documents/PresenceCursors";
import { useDocumentPresence } from "@/components/documents/useDocumentPresence";
import { useBreadcrumbTrail } from "@/lib/breadcrumbs";
import { resolveActiveCompany } from "@/lib/company";
import {
  cancelSignatureRequest,
  documentTypeLabel,
  fetchDocument,
  formatDocumentDate,
  requestSignature,
  reviewStatusLabel,
  sendDocument,
} from "@/lib/documents";
import type { DocumentRow } from "@/lib/documents";
import { canAuthor, roleByValue } from "@/lib/roles";
import { useRole } from "@/lib/role-store";

/**
 * The finished letter, rendered as a paper page: header, body, and the drawn
 * signature under the signer's name. While it is still a draft the page offers
 * edit, send, and delete; once sent it only reads.
 */
export function DocumentDetail({ documentId }: { documentId: string }) {
  const role = useRole();
  const [document, setDocument] = useState<DocumentRow | null>(null);
  const [companyName, setCompanyName] = useState("S.T.A.R.S");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paperRef = useRef<HTMLElement | null>(null);
  const { peers, color, caret, trackPointer } = useDocumentPresence(
    documentId,
    paperRef,
    roleByValue(role).label
  );

  useBreadcrumbTrail(document ? [document.title] : []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [company, loaded] = await Promise.all([
        resolveActiveCompany().catch(() => null),
        fetchDocument(documentId).catch((caught: unknown) => {
          if (alive) setError(caught instanceof Error ? caught.message : "Gagal memuat surat.");
          return null;
        }),
      ]);
      if (!alive) return;
      if (company) setCompanyName(company.name);
      setDocument(loaded);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [documentId]);

  async function send() {
    if (!document) return;
    setSending(true);
    setError(null);
    try {
      const updated = await sendDocument(document.id);
      setDocument(updated);
    } catch (caught) {
      const code = (caught as { code?: string }).code;
      setError(
        code === "signature_required"
          ? "Tandatangani dulu di halaman ubah sebelum mengirim."
          : caught instanceof Error
            ? caught.message
            : "Gagal mengirim surat."
      );
    } finally {
      setSending(false);
    }
  }

  /** A draft that already names its signer can go out as a request. */
  async function requestFromList() {
    if (!document?.signerUserId) return;
    setRequesting(true);
    setError(null);
    try {
      const updated = await requestSignature(document.id, document.signerUserId);
      setDocument(updated);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal meminta tanda tangan.");
    } finally {
      setRequesting(false);
    }
  }

  async function cancelRequest() {
    if (!document) return;
    setCancelling(true);
    setError(null);
    try {
      const updated = await cancelSignatureRequest(document.id);
      setDocument(updated);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal membatalkan permintaan.");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return <Muted>Memuat surat…</Muted>;
  }

  if (!document) {
    return (
      <EmptyState
        title="Surat tidak ditemukan"
        description={error ?? `Tidak ada surat dengan id ${documentId}.`}
        action={
          <Link href="/komunikasi/dokumen">
            <Button variant="secondary">Kembali ke dokumen</Button>
          </Link>
        }
      />
    );
  }

  const allowed = canAuthor(role);
  const isDraft = document.status === "draft";
  const isPending = document.status === "pending";
  const audience =
    document.audienceType === "department"
      ? document.audienceDepartmentName ?? "departemen"
      : "semua karyawan";

  return (
    <>
      <PageHeader
        title={document.title}
        description={`${documentTypeLabel(document.type)} · ${document.number} · ${audience}`}
        aside={
          <>
            <Badge tone={isDraft ? "warning" : isPending ? "info" : "success"} dot pill>
              {isDraft ? "draf" : isPending ? "menunggu tanda tangan" : "terkirim"}
            </Badge>
            <Link href="/komunikasi/dokumen">
              <Button size="sm" variant="secondary">
                Kembali
              </Button>
            </Link>
            {allowed && isDraft ? (
              <>
                <Link href={`/komunikasi/dokumen/${document.id}/edit`}>
                  <Button size="sm" variant="secondary">
                    Ubah
                  </Button>
                </Link>
                <Button size="sm" onClick={send} loading={sending}>
                  Kirim
                </Button>
                {!document.signature && document.signerUserId ? (
                  <Button size="sm" variant="secondary" onClick={requestFromList} loading={requesting}>
                    Minta tanda tangan
                  </Button>
                ) : null}
                <Link href={`/komunikasi/dokumen/${document.id}/delete`}>
                  <Button size="sm" variant="ghost">
                    Hapus
                  </Button>
                </Link>
              </>
            ) : null}
            {allowed && isPending ? (
              <>
                <Link href={`/komunikasi/dokumen/${document.id}/sign`}>
                  <Button size="sm">Tanda tangan</Button>
                </Link>
                <Button size="sm" variant="secondary" onClick={cancelRequest} loading={cancelling}>
                  Batalkan permintaan
                </Button>
                <Link href={`/komunikasi/dokumen/${document.id}/delete`}>
                  <Button size="sm" variant="ghost">
                    Hapus
                  </Button>
                </Link>
              </>
            ) : null}
            <Button size="sm" variant="ghost" onClick={() => setCollapsed((value) => !value)}>
              {collapsed ? "Tampilkan" : "Ciutkan"}
            </Button>
          </>
        }
      />

      {error ? <Alert tone="danger" title={error} /> : null}

      {collapsed ? (
        <Card
          title={document.title}
          description={`${documentTypeLabel(document.type)} · ${document.number}`}
          meta="Surat diciutkan"
          status={isPending ? "menunggu tanda tangan" : isDraft ? "draf" : "terkirim"}
        >
          <div className="doc-collapsed">
            <Muted>Isi surat disembunyikan supaya halaman ini ringkas.</Muted>
            <Button size="sm" variant="secondary" onClick={() => setCollapsed(false)}>
              Tampilkan surat
            </Button>
          </div>
        </Card>
      ) : (
        <DocumentPaper
          companyName={companyName}
          document={document}
          paperRef={paperRef}
          onMouseMove={trackPointer}
        >
          <PresenceCursors peers={peers} self={{ name: roleByValue(role).label, color, caret }} />
        </DocumentPaper>
      )}

      {document.attachments?.length ? (
        <Card
          title="Lampiran"
          description="Berkas ikut tersimpan di dalam surat sebagai base64."
          meta="Berkas"
          status={`${document.attachments.length} berkas`}
        >
          <div className="doc-files">
            {document.attachments.map((attachment) => (
              <a
                key={`${attachment.name}-${attachment.size}`}
                className="doc-file"
                href={attachment.dataUrl}
                download={attachment.name}
                target="_blank"
                rel="noreferrer"
              >
                <span className="doc-file__name">{attachment.name}</span>
                <span className="doc-file__meta">
                  {formatFileSize(attachment.size)} · {attachment.type || "berkas"}
                </span>
              </a>
            ))}
          </div>
        </Card>
      ) : null}

      <Card
        title="Review"
        description={
          document.reviewerUserId
            ? `Reviewer: ${document.reviewerName ?? "—"}`
            : "Belum ada reviewer yang diundang."
        }
        meta="Kolaborasi"
        status={reviewStatusLabel(document.reviewStatus)}
      >
        {document.reviewerUserId ? (
          <div className="doc-collapsed">
            <Muted>
              {document.reviewStatus === "invited"
                ? "Menunggu keputusan reviewer. Buka halaman review untuk melihat surat bersama kursor mereka."
                : document.reviewStatus === "approved"
                  ? `Disetujui${document.reviewedAt ? ` · ${formatDocumentDate(document.reviewedAt)}` : ""}.`
                  : `Meminta revisi${document.reviewedAt ? ` · ${formatDocumentDate(document.reviewedAt)}` : ""}.`}
              {document.reviewNote ? ` Catatan: ${document.reviewNote}` : ""}
            </Muted>
            <Link href={`/komunikasi/dokumen/${document.id}/review`}>
              <Button size="sm" variant="secondary">
                Buka halaman review
              </Button>
            </Link>
          </div>
        ) : (
          <Muted>Undang reviewer dari halaman ubah surat, di panel Review.</Muted>
        )}
      </Card>

      <Card title="Jejak dokumen" description="Siapa menulis, untuk siapa, dan kapan terkirim." meta="Audit">
        <StatRow label="Penulis" value={document.authorName ?? "—"} />
        <StatRow label="Audiens" value={audience} />
        <StatRow label="Dibuat" value={formatDocumentDate(document.createdAt)} />
        <StatRow
          label="Diminta"
          value={
            document.signatureRequestedAt
              ? `${document.signerName ?? "—"} · ${formatDocumentDate(document.signatureRequestedAt)}`
              : "tidak ada permintaan"
          }
        />
        <StatRow
          label="Ditandatangani"
          value={document.signedAt ? formatDocumentDate(document.signedAt) : "belum ditandatangani"}
        />
        <StatRow
          label="Dikirim"
          value={document.sentAt ? formatDocumentDate(document.sentAt) : "belum dikirim"}
        />
      </Card>
    </>
  );
}