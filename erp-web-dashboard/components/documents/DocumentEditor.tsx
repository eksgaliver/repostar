"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/arc/alert/alert";
import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { Combobox } from "@/components/arc/combobox/combobox";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import SegmentedControl from "@/components/arc/segmented-control/segmented-control";
import { Card } from "@/components/ui/Card";
import { Muted } from "@/components/ui/Table";
import { AttachmentField } from "@/components/documents/AttachmentField";
import { RichTextEditor } from "@/components/documents/RichTextEditor";
import { SignaturePad } from "@/components/documents/SignaturePad";
import { resolveActiveCompany } from "@/lib/company";
import { fetchDepartments } from "@/lib/departments";
import type { DepartmentRow } from "@/lib/departments";
import {
  DOCUMENT_TYPES,
  createDocument,
  documentTypeHeading,
  documentTypeLabel,
  fetchDocument,
  fetchSignerDirectory,
  formatDocumentDate,
  inviteReviewer,
  requestSignature,
  sendDocument,
  updateDocument,
} from "@/lib/documents";
import type { DocumentAttachment, DocumentTypeValue, SignerCandidate } from "@/lib/documents";
import { PresenceCursors } from "@/components/documents/PresenceCursors";
import { useDocumentPresence } from "@/components/documents/useDocumentPresence";
import { canAuthor, roleByValue } from "@/lib/roles";
import { useRole } from "@/lib/role-store";

interface DocumentEditorProps {
  mode: "create" | "edit";
  documentId?: string;
}

/**
 * The letter composer: a paper page on the left (perihal, body, signature) and
 * the metadata that fixes what gets sent on the right. The number is assigned by
 * the server on save, so it never depends on what the browser guessed.
 */
export function DocumentEditor({ mode, documentId }: DocumentEditorProps) {
  const router = useRouter();
  const role = useRole();

  const [company, setCompany] = useState<{ id: string; name: string } | null>(null);
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [signers, setSigners] = useState<SignerCandidate[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [type, setType] = useState<DocumentTypeValue>("internal_memo");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<DocumentAttachment[]>([]);
  const [signerName, setSignerName] = useState("");
  const [signerTitle, setSignerTitle] = useState("");
  const [signerUserId, setSignerUserId] = useState("");
  const [audienceType, setAudienceType] = useState<"all" | "department">("all");
  const [departmentId, setDepartmentId] = useState("");
  const [number, setNumber] = useState("");
  const [status, setStatus] = useState<"draft" | "pending" | "sent">("draft");
  const [today, setToday] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"draft" | "send" | "request" | "review" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(true);
  const [reviewerUserId, setReviewerUserId] = useState("");

  const paperRef = useRef<HTMLElement | null>(null);
  const { peers, color, caret, trackPointer } = useDocumentPresence(
    documentId ?? "baru",
    paperRef,
    roleByValue(role).label
  );

  /** `new Date()` in render breaks the prerender pass, so the date lands on mount. */
  useEffect(() => {
    setToday(formatDocumentDate(new Date().toISOString()));
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const active = await resolveActiveCompany();
      if (!alive) return;
      setCompany(active ? { id: active.id, name: active.name } : null);

      if (active) {
        const [rows, directory] = await Promise.all([
          fetchDepartments(active.id).catch(() => []),
          fetchSignerDirectory(active.id).catch(() => ({ signers: [], currentUserId: null })),
        ]);
        if (!alive) return;
        setDepartments(rows);
        setSigners(directory.signers);
        setCurrentUserId(directory.currentUserId);
      }

      if (mode === "edit" && documentId) {
        try {
          const document = await fetchDocument(documentId);
          if (!alive) return;
          setType(document.type);
          setTitle(document.title);
          setBody(document.body ?? "");
          setSignature(document.signature ?? null);
          setAttachments(document.attachments ?? []);
          setSignerName(document.signerName ?? "");
          setSignerTitle(document.signerTitle ?? "");
          setSignerUserId(document.signerUserId ?? "");
          setReviewerUserId(document.reviewerUserId ?? "");
          setAudienceType(document.audienceType);
          setDepartmentId(document.audienceDepartmentId ?? "");
          setNumber(document.number);
          setStatus(
            document.status === "sent" ? "sent" : document.status === "pending" ? "pending" : "draft"
          );
        } catch (caught) {
          if (alive) setError(caught instanceof Error ? caught.message : "Gagal memuat surat.");
        }
      }

      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [mode, documentId]);

  /** Choosing the signer carries the printed name and position with it. */
  function chooseSigner(value: string) {
    setSignerUserId(value);
    const candidate = signers.find((signer) => signer.id === value);
    if (!candidate) {
      setSignature(null);
      return;
    }
    setSignerName(candidate.fullName);
    setSignerTitle(candidate.positionName ?? roleByValue(candidate.role).label);
    setSignature(null);
  }

  /** One payload for save, send, and review invite. */
  function buildPayload() {
    if (!company) return null;
    return {
      companyId: company.id,
      type,
      title: title.trim(),
      body,
      signature,
      signerName: signerName.trim() || null,
      signerTitle: signerTitle.trim() || null,
      audienceType,
      audienceDepartmentId: audienceType === "department" ? departmentId || null : null,
      attachments,
    };
  }

  async function save(target: "draft" | "send" | "request") {
    if (!company) return;
    if (title.trim().length < 3) {
      setError("Perihal minimal 3 karakter.");
      return;
    }
    if (!body.replace(/<[^>]*>/g, " ").trim()) {
      setError("Isi surat belum ditulis.");
      return;
    }
    if (target === "send" && !signature) {
      setError("Tandatangani dulu sebelum mengirim surat.");
      return;
    }
    if (target === "request" && !signerUserId) {
      setError("Pilih user yang diminta menandatangani.");
      return;
    }

    const payload = buildPayload();
    if (!payload) return;

    setError(null);
    setBusy(target);
    try {
      const saved =
        mode === "edit" && documentId
          ? await updateDocument(documentId, payload)
          : await createDocument(payload);

      let final = saved;
      if (target === "request") {
        final = await requestSignature(saved.id, signerUserId);
      } else if (target === "send" && saved.status === "draft") {
        final = await sendDocument(saved.id);
      }
      router.push(`/komunikasi/dokumen/${final.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menyimpan surat.");
      setBusy(null);
    }
  }

  /** Saves first so the reviewer opens a real row, then sends the invite. */
  async function invite() {
    if (!company || !reviewerUserId) return;
    if (title.trim().length < 3) {
      setError("Perihal minimal 3 karakter.");
      return;
    }
    if (!body.replace(/<[^>]*>/g, " ").trim()) {
      setError("Isi surat belum ditulis.");
      return;
    }

    const payload = buildPayload();
    if (!payload) return;

    setError(null);
    setBusy("review");
    try {
      const saved =
        mode === "edit" && documentId
          ? await updateDocument(documentId, payload)
          : await createDocument(payload);
      await inviteReviewer(saved.id, reviewerUserId);
      router.push(`/komunikasi/dokumen/${saved.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal mengundang reviewer.");
      setBusy(null);
    }
  }

  if (loading) {
    return <Muted>Menyiapkan surat…</Muted>;
  }

  if (!canAuthor(role)) {
    return (
      <EmptyState
        title="Hanya level di atas karyawan"
        description="Menulis dan mengirim surat dibuka untuk manager, admin, dan super admin. Kamu tetap bisa membaca surat yang sudah dikirim."
        action={
          <Link href="/komunikasi/dokumen">
            <Button variant="secondary">Kembali ke dokumen</Button>
          </Link>
        }
      />
    );
  }

  if (mode === "edit" && status !== "draft") {
    return (
      <EmptyState
        title={status === "pending" ? "Menunggu tanda tangan" : "Surat sudah terkirim"}
        description={
          status === "pending"
            ? "Surat ini menunggu tanda tangan user yang diminta, jadi isinya terkunci sampai ditandatangani atau permintaannya dibatalkan."
            : "Surat yang sudah dikirim terkunci beserta tanda tangannya, jadi isinya tidak bisa diubah lagi."
        }
        action={
          <Link href={`/komunikasi/dokumen/${documentId}`}>
            <Button variant="secondary">Lihat surat</Button>
          </Link>
        }
      />
    );
  }

  const selectedType = DOCUMENT_TYPES.find((option) => option.value === type);
  const selectedSigner = signers.find((signer) => signer.id === signerUserId) ?? null;
  /** Picking yourself means you sign here; anyone else gets a request. */
  const signsItself = Boolean(signerUserId) && signerUserId === currentUserId;

  return (
    <div className="doc-editor">
      <div className="doc-editor__main">
      <section
        ref={paperRef}
        className="doc-paper doc-paper--a4"
        aria-label="Pratinjau surat"
        onMouseMove={trackPointer}
      >
        <PresenceCursors peers={peers} self={{ name: roleByValue(role).label, color, caret }} />
        <header className="doc-paper__head">
          <div>
            <p className="doc-paper__company">{company?.name ?? "S.T.A.R.S"}</p>
          </div>
          <Badge size="sm" tone={status === "sent" ? "success" : "neutral"} dot>
            {status === "sent" ? "terkirim" : "draf"}
          </Badge>
        </header>

        <div className="doc-paper__type-block">
          <p className="doc-paper__type">{documentTypeHeading(type)}</p>
          <p className="doc-paper__number">
            Nomor: {number || "dibuat otomatis saat disimpan"}
          </p>
        </div>

        <input
          className="doc-paper__title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Perihal surat"
          aria-label="Perihal surat"
        />

        <RichTextEditor value={body} onChange={setBody} />

        <footer className="doc-paper__sign">
          <div className="doc-paper__sign-place">
            <p className="doc-paper__sign-city">
              {company?.name ?? ""}
              {today ? `, ${today}` : ""}
            </p>
            {signsItself ? (
              <SignaturePad value={signature} onChange={setSignature} />
            ) : (
              <p className="doc-paper__sign-empty">
                {signerUserId
                  ? `Menunggu tanda tangan ${signerName}`
                  : "Pilih penanda tangan di panel kanan"}
              </p>
            )}
            <p className="doc-paper__sign-name">{signerName || "Nama penanda tangan"}</p>
            <p className="doc-paper__sign-title">{signerTitle || "Jabatan"}</p>
          </div>
        </footer>
      </section>

      <Card
        title="Lampiran"
        description="Berkas dibaca di perangkat ini, diubah ke base64, lalu disimpan bersama surat."
        meta="Opsional"
        status={`${attachments.length} berkas`}
      >
        <AttachmentField value={attachments} onChange={setAttachments} />
      </Card>
      </div>

      <aside className="doc-side">
        <Card
          title="Detail surat"
          description="Tipe menentukan awalan nomor; audiens menentukan siapa yang menerima salinannya."
          meta={detailsOpen ? "Wajib" : "Diciutkan"}
        >
          <div className="doc-side__toggle">
            <Button size="sm" variant="ghost" onClick={() => setDetailsOpen((value) => !value)}>
              {detailsOpen ? "Ciutkan" : "Buka detail"}
            </Button>
          </div>

          {detailsOpen ? (
            <>
          <Combobox
            label="Tipe surat"
            options={DOCUMENT_TYPES.map((option) => ({ value: option.value, label: option.label }))}
            value={type}
            onValueChange={(value) => setType(value as DocumentTypeValue)}
            description={selectedType?.hint}
          />

          <div className="doc-side__field">
            <span className="doc-side__label">Audiens</span>
            <SegmentedControl
              label="Audiens"
              options={[
                { value: "all", label: "Semua karyawan" },
                { value: "department", label: "Departemen" },
              ]}
              value={audienceType}
              onValueChange={(value) => setAudienceType(value as "all" | "department")}
            />
          </div>

          {audienceType === "department" ? (
            <Combobox
              label="Departemen tujuan"
              options={departments.map((department) => ({
                value: department.id,
                label: `${department.name} · ${department.code}`,
              }))}
              value={departmentId}
              onValueChange={setDepartmentId}
              emptyMessage="Belum ada departemen."
            />
          ) : null}

          <Combobox
            label="Penanda tangan"
            options={signers.map((signer) => ({
              value: signer.id,
              label: signer.positionName
                ? `${signer.fullName} · ${signer.positionName}`
                : signer.fullName,
            }))}
            value={signerUserId}
            onValueChange={chooseSigner}
            placeholder="Pilih user…"
            emptyMessage="Belum ada akun user yang bisa dipilih."
            description={
              !signerUserId
                ? "Nama dan posisi mengikuti user yang dipilih."
                : signsItself
                  ? "Kamu yang menandatangani, langsung di halaman surat."
                  : "Surat dikirim ke user ini sebagai permintaan tanda tangan."
            }
          />

          <div className="doc-signer">
            <span className="doc-signer__label">Tercetak di surat</span>
            <span className="doc-signer__name">{signerName || "Belum ada penanda tangan"}</span>
            <span className="doc-signer__meta">
              {selectedSigner
                ? [signerTitle, selectedSigner.departmentName].filter(Boolean).join(" · ")
                : "Posisi mengikuti user yang dipilih"}
            </span>
          </div>

          <Muted>
            {signsItself
              ? "Tanda tangan digambar di halaman surat, di atas nama penanda tangan."
              : "User yang dipilih menandatangani lebih dulu sebelum surat terkirim."}
          </Muted>
            </>
          ) : (
            <Muted>
              {documentTypeLabel(type)} ·{" "}
              {audienceType === "department" ? "departemen" : "semua karyawan"} ·{" "}
              {signerName || "belum ada penanda tangan"}
            </Muted>
          )}
        </Card>

        <Card
          title="Review"
          description="Undang satu user untuk membaca surat ini dan memberi keputusan."
          meta={reviewOpen ? "Opsional" : "Diciutkan"}
        >
          <div className="doc-side__toggle">
            <Button size="sm" variant="ghost" onClick={() => setReviewOpen((value) => !value)}>
              {reviewOpen ? "Ciutkan" : "Buka review"}
            </Button>
          </div>

          {reviewOpen ? (
            <>
              <Combobox
                label="Reviewer"
                options={signers.map((signer) => ({ value: signer.id, label: signer.fullName }))}
                value={reviewerUserId}
                onValueChange={setReviewerUserId}
                placeholder="Pilih user…"
                emptyMessage="Belum ada akun user."
                description="Reviewer melihat surat dan posisi kursor kamu, lalu menyetujui atau meminta revisi."
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={invite}
                loading={busy === "review"}
                disabled={!reviewerUserId || busy !== null}
              >
                Undang reviewer
              </Button>
            </>
          ) : (
            <Muted>{reviewerUserId ? "Reviewer sudah dipilih." : "Belum ada reviewer."}</Muted>
          )}
        </Card>

        {error ? <Alert tone="danger" title={error} /> : null}

        <div className="doc-actions">
          <Button
            variant="secondary"
            onClick={() => save("draft")}
            loading={busy === "draft"}
            disabled={busy !== null}
          >
            Simpan draf
          </Button>
          {signsItself ? (
            <Button onClick={() => save("send")} loading={busy === "send"} disabled={busy !== null}>
              Kirim surat
            </Button>
          ) : signerUserId ? (
            <Button
              onClick={() => save("request")}
              loading={busy === "request"}
              disabled={busy !== null}
            >
              Minta tanda tangan
            </Button>
          ) : (
            <Button disabled>Pilih penanda tangan</Button>
          )}
        </div>
      </aside>
    </div>
  );
}