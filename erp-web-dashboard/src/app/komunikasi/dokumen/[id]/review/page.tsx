import type { Metadata } from "next";
import { DocumentReview } from "@/components/documents/DocumentReview";

export const metadata: Metadata = { title: "Review surat · S.T.A.R.S" };

/** Same placeholder as the detail route; real ids render on demand. */
export function generateStaticParams(): { id: string }[] {
  return [{ id: "contoh" }];
}

/** The review room: letter on the left, decision panel and cursor count on the right. */
export default async function ReviewDocumentPage(props: PageProps<"/komunikasi/dokumen/[id]/review">) {
  const { id } = await props.params;
  return <DocumentReview documentId={id} />;
}