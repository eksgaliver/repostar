import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/arc/button/button";
import { DocumentEditor } from "@/components/documents/DocumentEditor";
import { PageHeader } from "@/components/ui/Table";

export const metadata: Metadata = { title: "Surat baru · S.T.A.R.S" };

/** Create: paper editor on the left, metadata (type, audience, signer) on the right. */
export default function NewDocumentPage() {
  return (
    <>
      <PageHeader
        title="Surat baru"
        description="Pilih tipe surat, tulis isinya, lalu tanda tangan langsung di halaman. Simpan sebagai draf atau kirim."
        aside={
          <Link href="/komunikasi/dokumen">
            <Button size="sm" variant="secondary">
              Batal
            </Button>
          </Link>
        }
      />

      <DocumentEditor mode="create" />
    </>
  );
}