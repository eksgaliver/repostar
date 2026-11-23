import { DepartmentDetail } from "@/components/departments/DepartmentDetail";

/**
 * cacheComponents needs at least one prerendered param; this placeholder keeps
 * the build validated while real department ids resolve on demand.
 */
export function generateStaticParams(): { id: string }[] {
  return [{ id: "contoh" }];
}

/** Detail: members with avatars, edit, and delete. */
export default async function DepartmentDetailPage(props: PageProps<"/human-resources/departemen/[id]">) {
  const { id } = await props.params;
  return <DepartmentDetail departmentId={id} />;
}