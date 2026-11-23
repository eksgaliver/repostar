"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/arc/alert/alert";
import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { Card } from "@/components/ui/Card";
import { Muted, PageHeader } from "@/components/ui/Table";
import { DocumentPaper } from "@/components/documents/DocumentPaper";
import { PresenceCursors } from "@/components/documents/PresenceCursors";
import { useDocumentPresence } from "@/components/documents/useDocumentPresence";
import { useBreadcrumbTrail } from "@/lib/breadcrumbs";
import { resolveActiveCompany } from "@/lib/company";
import { fetchDocument, respondReview, reviewStatusLabel } from "@/lib/documents";
import type { DocumentRow } from "@/lib/documents";
import { roleByValue } from "@/lib/roles";
import { useRole } from "@/lib/role-store";

/**
 * The review room: the invited reviewer and the author open the same letter and
 * see each other's cursor. The reviewer leaves a note and either approves or
 * asks for a revision.
 */
export function DocumentReview({ documentId }: { documentId: string }) {
  const role = useRole();
  const [document, setDocument] = useState<DocumentRow | null>(null);
  const [companyName, setCompanyName] = useState("S.T.A.R.S");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"approved" | "revision" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const paperRef = useRef<HTMLElement | null>(null);
  const { peers, color, caret, trackPointer } = useDocumentPresence(
    documentId,
    paperRef,
    roleByValue(role).label
  );

  useBreadcrumbTrail(document ? [document.title, "Review"] : []);

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
      setNote(loaded?.reviewNote ?? "");
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [documentId]);

  async function submit(approved: boolean) {
    setBusy(approved ? "approved" : "revision");
    setError(null);
    try {
      const updated = await respondReview(documentId, {
        approved,
        note: note.trim() || null,
      });
      setDocument(updated);
    } catch (caught) {
      const code = (caught as { code?: string }).code;
      setError(
        code === "not_invited_reviewer"
          ? "Surat ini diundang untuk reviewer lain, jadi hanya akun itu yang bisa memutuskan."
          : caught instanceof Error
            ? caught.message
            : "Gagal menyimpan keputusan review."
      );
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return <Muted>Memuat ruang review…</Muted>;
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

  const invited = document.reviewStatus === "invited";

  return (
    <>
      <PageHeader
        title="Review surat"
        description={`${document.title} · reviewer ${document.reviewerName ?? "—"}`}
        aside={
          <>
            <Badge tone={invited ? "info" : document.reviewStatus === "approved" ? "success" : "warning"} dot pill>
              {reviewStatusLabel(document.reviewStatus)}
            </Badge>
            <Link href={`/komunikasi/dokumen/${document.id}`}>
              <Button size="sm" variant="secondary">
                Kembali ke surat
              </Button>
            </Link>
          </>
        }
      />

      {error ? <Alert tone="danger" title={error} /> : null}

      <div className="doc-editor">
        <DocumentPaper
          companyName={companyName}
          document={document}
          paperRef={paperRef}
          onMouseMove={trackPointer}
        >
          <PresenceCursors peers={peers} self={{ name: roleByValue(role).label, color, caret }} />
        </DocumentPaper>

        <aside className="doc-side">
          <Card
            title="Keputusan review"
            description="Catatan tersimpan bersama surat dan terlihat oleh penulis."
            meta="Kolaborasi"
            status={reviewStatusLabel(document.reviewStatus)}
          >
            {invited ? (
              <>
                <label className="doc-side__field">
                  <span className="doc-side__label">Catatan untuk penulis</span>
                  <textarea
                    className="doc-review__note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={5}
                    placeholder="Bagian mana yang perlu diperbaiki?"
                  />
                </label>
                <div className="doc-actions">
                  <Button
                    variant="secondary"
                    onClick={() => submit(false)}
                    loading={busy === "revision"}
                    disabled={busy !== null}
                  >
                    Minta revisi
                  </Button>
                  <Button onClick={() => submit(true)} loading={busy === "approved"} disabled={busy !== null}>
                    Setujui
                  </Button>
                </div>
              </>
            ) : (
              <Muted>
                Review selesai: {reviewStatusLabel(document.reviewStatus)}.
                {document.reviewNote ? ` Catatan: ${document.reviewNote}` : ""}
              </Muted>
            )}
          </Card>

          <Card
            title="Kolaborasi"
            description="Posisi kursor tampil di halaman surat. Gerakkan mouse atau pilih teks untuk memperbarui."
            meta={peers.length ? `${peers.length + 1} kursor` : "1 kursor"}
          >
            <Muted>
              {peers.length
                ? `Sedang di sini: ${peers.map((peer) => peer.name).join(", ")}.`
                : "Belum ada peserta lain. Buka surat ini di akun penulis untuk melihat dua kursor."}
            </Muted>
          </Card>
        </aside>
      </div>
    </>
  );
}