import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/arc/button/button";
import { DocumentDirectory } from "@/components/documents/DocumentDirectory";
import { PageHeader } from "@/components/ui/Table";

export const metadata: Metadata = { title: "Dokumen · S.T.A.R.S" };

/** Letter archive: drafts and sent documents, filtered by type and status. */
export default function DocumentsPage() {
  return (
    <>
      <PageHeader
        title="Dokumen"
        description="Menulis surat seperti di Word: tipe surat, isi, dan tanda tangan di satu halaman. Nomor surat dibuat otomatis saat disimpan."
        aside={
          <Link href="/komunikasi/dokumen/new">
            <Button size="sm">Surat baru</Button>
          </Link>
        }
      />

      <DocumentDirectory />
    </>
  );
}