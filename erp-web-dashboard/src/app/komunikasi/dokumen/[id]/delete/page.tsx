import type { Metadata } from "next";
import { DocumentDelete } from "@/components/documents/DocumentDelete";

export const metadata: Metadata = { title: "Hapus surat · S.T.A.R.S" };

/** Same placeholder as the detail route; real ids render on demand. */
export function generateStaticParams(): { id: string }[] {
  return [{ id: "contoh" }];
}

/** Delete: confirmation page with hold-to-confirm. */
export default async function DeleteDocumentPage(props: PageProps<"/komunikasi/dokumen/[id]/delete">) {
  const { id } = await props.params;
  return <DocumentDelete documentId={id} />;
}