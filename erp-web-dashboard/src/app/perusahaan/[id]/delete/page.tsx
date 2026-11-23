import { CompanyDeleteView } from "@/components/company/CompanyDeleteView";
import { sampleCompanies } from "@/lib/company";

/** Same prerender hint as the detail route: the shell needs a known path. */
export function generateStaticParams() {
  return sampleCompanies.map((company) => ({ id: company.id }));
}

/** Delete: its own route with the impact spelled out before the held confirm. */
export default async function DeleteCompanyPage(props: PageProps<"/perusahaan/[id]/delete">) {
  const { id } = await props.params;
  return <CompanyDeleteView companyId={id} />;
}