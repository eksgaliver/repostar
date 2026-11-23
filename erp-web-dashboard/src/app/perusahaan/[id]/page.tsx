import { CompanyDetailView } from "@/components/company/CompanyDetailView";
import { sampleCompanies } from "@/lib/company";

/**
 * Prerender hints: the shell reads `usePathname()`, which needs a known path at
 * build time. Ids outside this list still resolve on demand at runtime.
 */
export function generateStaticParams() {
  return sampleCompanies.map((company) => ({ id: company.id }));
}

/** Detail: read-only view of one tenant. */
export default async function CompanyDetailPage(props: PageProps<"/perusahaan/[id]">) {
  const { id } = await props.params;
  return <CompanyDetailView companyId={id} />;
}