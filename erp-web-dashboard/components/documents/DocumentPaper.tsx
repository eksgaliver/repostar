"use client";

import type { MouseEvent as ReactMouseEvent, ReactNode, Ref } from "react";
import { documentTypeHeading, formatDocumentDate, sanitizeDocumentHtml } from "@/lib/documents";
import type { DocumentRow } from "@/lib/documents";

interface DocumentPaperProps {
  companyName: string;
  document: DocumentRow;
  /** The paper is the coordinate space for the live cursors. */
  paperRef?: Ref<HTMLElement>;
  onMouseMove?: (event: ReactMouseEvent<HTMLElement>) => void;
  children?: ReactNode;
}

/**
 * The finished letter as an A4 page: company head, number, body, and the drawn
 * signature under the printed name. Used by the detail and review screens.
 */
export function DocumentPaper({ companyName, document, paperRef, onMouseMove, children }: DocumentPaperProps) {
  const pending = document.status === "pending";

  return (
    <article
      ref={paperRef}
      className="doc-paper doc-paper--read doc-paper--a4"
      aria-label="Surat"
      onMouseMove={onMouseMove}
    >
      {children}
      <header className="doc-paper__head">
        <div>
          <p className="doc-paper__company">{companyName}</p>
        </div>
        <p className="doc-paper__stamp">
          {formatDocumentDate(document.sentAt ?? document.createdAt)}
        </p>
      </header>

      <div className="doc-paper__type-block">
        <p className="doc-paper__type">{documentTypeHeading(document.type)}</p>
        <p className="doc-paper__number">Nomor: {document.number}</p>
      </div>

      <h1 className="doc-paper__heading">{document.title}</h1>

      <div
        className="doc-paper__body"
        dangerouslySetInnerHTML={{ __html: sanitizeDocumentHtml(document.body ?? "") }}
      />

      <footer className="doc-paper__sign">
        <div className="doc-paper__sign-place">
          <p className="doc-paper__sign-city">
            {companyName}
            {document.sentAt ? `, ${formatDocumentDate(document.sentAt)}` : ""}
          </p>
          {document.signature ? (
            <img
              className="doc-paper__sign-img"
              src={document.signature}
              alt={`Tanda tangan ${document.signerName ?? "penanda tangan"}`}
            />
          ) : pending ? (
            <p className="doc-paper__sign-empty">
              Menunggu tanda tangan {document.signerName ?? "user yang diminta"}
            </p>
          ) : (
            <p className="doc-paper__sign-empty">Belum ditandatangani</p>
          )}
          <p className="doc-paper__sign-name">{document.signerName ?? "—"}</p>
          <p className="doc-paper__sign-title">{document.signerTitle ?? ""}</p>
        </div>
      </footer>
    </article>
  );
}