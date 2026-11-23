import { EmployeeDetail } from "@/components/people/EmployeeDetail";
import { sampleCompanies } from "@/lib/company";

/** Prerender hints: the shell reads `usePathname()`, which needs a known path. */
export function generateStaticParams() {
  return sampleCompanies.map((company) => ({ id: company.id }));
}

/** Detail of one employee, with the resign action. */
export default async function EmployeeDetailPage(props: PageProps<"/human-resources/karyawan/[id]">) {
  const { id } = await props.params;
  return <EmployeeDetail employeeId={id} />;
}