import type { Metadata } from "next";
import { DocumentSign } from "@/components/documents/DocumentSign";

export const metadata: Metadata = { title: "Tanda tangan surat · S.T.A.R.S" };

/** Same placeholder as the detail route; real ids render on demand. */
export function generateStaticParams(): { id: string }[] {
  return [{ id: "contoh" }];
}

/** The requested user signs the pending letter here. */
export default async function SignDocumentPage(props: PageProps<"/komunikasi/dokumen/[id]/sign">) {
  const { id } = await props.params;
  return <DocumentSign documentId={id} />;
}