import { DocumentDetail } from "@/components/documents/DocumentDetail";

/**
 * cacheComponents needs at least one prerendered param; the placeholder keeps
 * the build validated while real document ids resolve on demand.
 */
export function generateStaticParams(): { id: string }[] {
  return [{ id: "contoh" }];
}

/** Detail: the letter as a signed paper page. */
export default async function DocumentDetailPage(props: PageProps<"/komunikasi/dokumen/[id]">) {
  const { id } = await props.params;
  return <DocumentDetail documentId={id} />;
}