"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AvatarGroup } from "@/components/arc/avatar-group/avatar-group";
import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { SearchField } from "@/components/arc/search-field/search-field";
import { Card } from "@/components/ui/Card";
import { Muted } from "@/components/ui/Table";
import { resolveActiveCompany } from "@/lib/company";
import { fetchDepartments, type DepartmentRow } from "@/lib/departments";
import { fetchEmployees } from "@/lib/people";
import type { EmployeeRow } from "@/lib/people";

interface DepartmentEntry {
  department: DepartmentRow;
  members: EmployeeRow[];
}

/**
 * Department list: one row per department with a stacked avatar preview of its
 * members, so the size of each team reads at a glance.
 */
export function DepartmentDirectory() {
  const router = useRouter();
  const [entries, setEntries] = useState<DepartmentEntry[] | null>(null);
  const [companyCode, setCompanyCode] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const company = await resolveActiveCompany();
      if (!company) {
        if (alive) setEntries([]);
        return;
      }
      if (alive) setCompanyCode(company.code);
      try {
        const [departments, employees] = await Promise.all([
          fetchDepartments(company.id),
          fetchEmployees(company.id).catch(() => []),
        ]);
        if (!alive) return;
        setEntries(
          departments.map((department) => ({
            department,
            members: employees.filter((employee) => employee.departmentId === department.id),
          }))
        );
      } catch (caught) {
        if (!alive) return;
        setEntries([]);
        setError(caught instanceof Error ? caught.message : "Gagal memuat departemen.");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const visible = useMemo(() => {
    const list = entries ?? [];
    const needle = query.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((entry) =>
      `${entry.department.code} ${entry.department.name}`.toLowerCase().includes(needle)
    );
  }, [entries, query]);

  if (entries === null) {
    return <Muted>Memuat departemen…</Muted>;
  }

  if (!entries.length) {
    return (
      <EmptyState
        title={error ? "Departemen gagal dimuat" : "Belum ada departemen"}
        description={error ?? "Tambahkan departemen pertama, lalu tugaskan karyawan ke dalamnya."}
        action={
          <Link href="/human-resources/departemen/new">
            <Button>Departemen baru</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Muted>{visible.length} departemen di {companyCode}</Muted>
        <div className="w-full sm:w-80">
          <SearchField
            label="Cari departemen"
            placeholder="Kode atau nama departemen…"
            value={query}
            onValueChange={setQuery}
          />
        </div>
      </div>

      <Card
        title="Daftar departemen"
        description="Klik satu baris untuk melihat anggota, menambah posisi, dan mengubah penempatan."
        meta="HR"
        status={`${entries.reduce((total, entry) => total + entry.members.length, 0)} anggota`}
      >
        <div className="dept-head">
          <span>Departemen</span>
          <span>Anggota</span>
          <span>Status</span>
        </div>

        {visible.map(({ department, members }) => (
          <button
            key={department.id}
            type="button"
            className="dept-row"
            onClick={() => router.push(`/human-resources/departemen/${department.id}`)}
          >
            <span className="dept-name">
              <span className="dept-name__text">{department.name}</span>
              <span className="dept-name__code">{department.code}</span>
            </span>

            <span className="dept-members">
              {members.length ? (
                <AvatarGroup
                  members={members.slice(0, 5).map((member) => ({
                    name: member.fullName,
                    src: member.photo ?? undefined,
                  }))}
                  max={5}
                  size="sm"
                  label={`${members.length} anggota ${department.name}`}
                />
              ) : (
                <Muted>belum ada anggota</Muted>
              )}
            </span>

            <Badge size="sm" dot tone={department.isActive ? "success" : "neutral"}>
              {department.isActive ? "aktif" : "nonaktif"}
            </Badge>
          </button>
        ))}
      </Card>
    </div>
  );
}