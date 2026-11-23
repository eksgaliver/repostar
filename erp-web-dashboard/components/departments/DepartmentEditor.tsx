"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/arc/button/button";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { Muted } from "@/components/ui/Table";
import { DepartmentForm } from "@/components/departments/DepartmentForm";
import { resolveActiveCompany } from "@/lib/company";
import { fetchDepartments, type DepartmentRow } from "@/lib/departments";

/** Edit route: loads the department, then hands it to the shared form. */
export function DepartmentEditor({ departmentId }: { departmentId: string }) {
  const [department, setDepartment] = useState<DepartmentRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const company = await resolveActiveCompany();
      if (!company) {
        if (alive) setLoading(false);
        return;
      }
      const list = await fetchDepartments(company.id).catch(() => []);
      if (!alive) return;
      setDepartment(list.find((item) => item.id === departmentId) ?? null);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [departmentId]);

  if (loading) {
    return <Muted>Memuat departemen…</Muted>;
  }

  if (!department) {
    return (
      <EmptyState
        title="Departemen tidak ditemukan"
        description={`Tidak ada departemen dengan id ${departmentId}, jadi tidak ada yang bisa diubah.`}
        action={
          <Link href="/human-resources/departemen">
            <Button variant="secondary">Kembali ke daftar</Button>
          </Link>
        }
      />
    );
  }

  return <DepartmentForm mode="edit" department={department} />;
}