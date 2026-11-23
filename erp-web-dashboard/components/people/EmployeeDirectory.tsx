"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, UserMinus } from "lucide-react";
import { Avatar } from "@/components/arc/avatar/avatar";
import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { ChipGroup } from "@/components/arc/chip-group/chip-group";
import { Combobox } from "@/components/arc/combobox/combobox";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import SegmentedControl from "@/components/arc/segmented-control/segmented-control";
import { SwipeActions, SwipeActionsRow } from "@/components/arc/swipe-actions/swipe-actions";
import { SearchField } from "@/components/arc/search-field/search-field";
import { Card } from "@/components/ui/Card";
import { Muted } from "@/components/ui/Table";
import { fetchCompanies } from "@/lib/company";
import { fetchDepartments, type DepartmentRow } from "@/lib/departments";
import { STATUS_LABEL, TYPE_LABEL, fetchEmployees } from "@/lib/people";
import type { EmployeeRow } from "@/lib/people";

const STATUS_TONE = { active: "success", inactive: "warning", resigned: "neutral" } as const;
const PAGE_SIZE = 25;

/**
 * Employee list with an avatar per row. Swiping a row to the left reveals the
 * actions; resign opens the employee page where the held confirm lives.
 */
export function EmployeeDirectory() {
  const router = useRouter();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyCode, setCompanyCode] = useState("");
  const [rows, setRows] = useState<EmployeeRow[] | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("");
  const [department, setDepartment] = useState("");
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { rows: companies } = await fetchCompanies();
      const stored = window.localStorage.getItem("stars:active-company");
      const active = companies.find((item) => item.id === stored) ?? companies[0];
      if (!active) {
        if (alive) setRows([]);
        return;
      }
      if (alive) {
        setCompanyId(active.id);
        setCompanyCode(active.code);
      }
      try {
        const [employees, departmentList] = await Promise.all([
          fetchEmployees(active.id),
          fetchDepartments(active.id).catch(() => []),
        ]);
        if (alive) {
          setRows(employees);
          setDepartments(departmentList);
        }
      } catch (caught) {
        if (alive) {
          setRows([]);
          setError(caught instanceof Error ? caught.message : "Gagal memuat karyawan.");
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const options = useMemo(() => {
    const list = rows ?? [];
    const count = (value: string) =>
      value === "all" ? list.length : list.filter((row) => row.status === value).length;
    return [
      { value: "all", label: "Semua", accessory: count("all") },
      { value: "active", label: "Aktif", accessory: count("active") },
      { value: "inactive", label: "Nonaktif", accessory: count("inactive") },
      { value: "resigned", label: "Resign", accessory: count("resigned") },
    ];
  }, [rows]);

  const visible = useMemo(() => {
    const list = rows ?? [];
    const needle = query.trim().toLowerCase();
    return list.filter((row) => {
      if (status !== "all" && row.status !== status) return false;
      if (type && row.type !== type) return false;
      if (department && row.departmentId !== department) return false;
      if (!needle) return true;
      return `${row.employeeCode} ${row.fullName} ${row.nik ?? ""} ${row.email ?? ""}`
        .toLowerCase()
        .includes(needle);
    });
  }, [rows, query, status, type, department]);

  // Filter changes start over at the first page.
  useEffect(() => {
    setPage(1);
  }, [query, status, type, department]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const rangeStart = visible.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, visible.length);

  if (rows === null) {
    return <Muted>Memuat karyawan…</Muted>;
  }

  if (!companyId) {
    return (
      <EmptyState
        title="Belum ada perusahaan"
        description="Tambahkan perusahaan dulu, lalu karyawan bisa didaftarkan di bawahnya."
        action={
          <Link href="/perusahaan/new">
            <Button>Perusahaan baru</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <SegmentedControl options={options} value={status} onValueChange={setStatus} label="Filter status" />

        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-72">
            <Combobox
              label="Departemen"
              options={[
                { value: "", label: "Semua departemen" },
                ...departments.map((item) => ({ value: item.id, label: `${item.name} · ${item.code}` })),
              ]}
              value={department}
              onValueChange={setDepartment}
              placeholder="Semua departemen"
            />
          </div>

          <ChipGroup
            label="Tipe karyawan"
            options={[
              { value: "S", label: "Staff" },
              { value: "D", label: "Supir" },
              { value: "MK", label: "Mekanik" },
            ]}
            value={type ? [type] : []}
            onValueChange={(next) => setType(next[0] ?? "")}
          />

          <div className="w-full sm:w-72">
            <SearchField
              label="Cari karyawan"
              placeholder="Kode, nama, NIK, atau email…"
              value={query}
              onValueChange={setQuery}
            />
          </div>

          {status !== "all" || type || department || query ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setStatus("all");
                setType("");
                setDepartment("");
                setQuery("");
              }}
            >
              Hapus filter
            </Button>
          ) : null}
        </div>
      </div>

      {error ? <Muted>{error}</Muted> : null}

      <Card
        title={`Karyawan ${companyCode}`}
        description="Geser baris ke kiri untuk membuka aksi resign. Klik baris untuk detail."
        meta="HR"
        status={`${visible.length} dari ${rows.length}`}
      >
        <div className="emp-head">
          <span>Karyawan</span>
          <span>Tipe</span>
          <span>Kontrak</span>
          <span>Masuk</span>
          <span>Status</span>
        </div>

        {pageRows.length ? (
          <SwipeActions label="Daftar karyawan">
            {pageRows.map((row) => {
              const href = `/human-resources/karyawan/${row.id}`;
              return (
                <SwipeActionsRow
                  key={row.id}
                  label={row.fullName}
                  fullSwipe={false}
                  trailing={[
                    {
                      label: "Resign",
                      icon: <UserMinus size={16} strokeWidth={1.75} />,
                      tone: "danger",
                      onSelect: () => router.push(href),
                    },
                    {
                      label: "Detail",
                      icon: <ArrowRight size={16} strokeWidth={1.75} />,
                      tone: "neutral",
                      onSelect: () => router.push(href),
                    },
                  ]}
                >
                  <button type="button" className="emp-row" onClick={() => router.push(href)}>
                    <span className="emp-person">
                      <Avatar name={row.fullName} src={row.photo ?? undefined} size="md" />
                      <span className="emp-person__text">
                        <span className="emp-person__name">{row.fullName}</span>
                        <span className="emp-person__meta">
                          {row.employeeCode} · {row.email ?? row.phone ?? "—"}
                        </span>
                      </span>
                    </span>
                    <span className="emp-cell">{TYPE_LABEL[row.type] ?? row.type}</span>
                    <span className="emp-cell">{row.contractType ?? "—"}</span>
                    <span className="emp-cell">{row.joinDate}</span>
                    <Badge size="sm" dot tone={STATUS_TONE[row.status] ?? "neutral"}>
                      {STATUS_LABEL[row.status] ?? row.status}
                    </Badge>
                  </button>
                </SwipeActionsRow>
              );
            })}
          </SwipeActions>
        ) : (
          <Muted>Belum ada karyawan yang cocok.</Muted>
        )}

        <div className="emp-pager">
          <Muted>
            Menampilkan {rangeStart}–{rangeEnd} dari {visible.length} karyawan · 25 per halaman
          </Muted>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={currentPage === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Sebelumnya
            </Button>
            <Muted>
              Halaman {currentPage} / {pageCount}
            </Muted>
            <Button
              size="sm"
              variant="secondary"
              disabled={currentPage >= pageCount}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}