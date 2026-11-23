import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/arc/button/button";
import { DocumentEditor } from "@/components/documents/DocumentEditor";
import { PageHeader } from "@/components/ui/Table";

export const metadata: Metadata = { title: "Ubah surat · S.T.A.R.S" };

/** Same placeholder as the detail route; real ids render on demand. */
export function generateStaticParams(): { id: string }[] {
  return [{ id: "contoh" }];
}

/** Update: only drafts reach this route; the API refuses a sent letter. */
export default async function EditDocumentPage(props: PageProps<"/komunikasi/dokumen/[id]/edit">) {
  const { id } = await props.params;
  return (
    <>
      <PageHeader
        title="Ubah surat"
        description="Draf masih bisa diubah. Nomor surat tetap dan baru terpakai saat dikirim."
        aside={
          <Link href={`/komunikasi/dokumen/${id}`}>
            <Button size="sm" variant="secondary">
              Batal
            </Button>
          </Link>
        }
      />

      <DocumentEditor mode="edit" documentId={id} />
    </>
  );
}