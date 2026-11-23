"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert } from "@/components/arc/alert/alert";
import { Avatar } from "@/components/arc/avatar/avatar";
import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { DatePicker } from "@/components/arc/date-picker/date-picker";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { HoldToConfirm } from "@/components/arc/hold-to-confirm/hold-to-confirm";
import { RadioGroup } from "@/components/arc/radio-group/radio-group";
import { Card } from "@/components/ui/Card";
import { Muted } from "@/components/ui/Table";
import { useBreadcrumbTrail } from "@/lib/breadcrumbs";
import { STATUS_LABEL, TYPE_LABEL, fetchEmployee, resignEmployee, setEmployeeRole } from "@/lib/people";
import type { EmployeeRow } from "@/lib/people";
import { roles } from "@/lib/roles";
import { useRole } from "@/lib/role-store";

const STATUS_TONE = { active: "success", inactive: "warning", resigned: "neutral" } as const;

/** Employee detail, with the resign action kept on this page. */
export function EmployeeDetail({ employeeId }: { employeeId: string }) {
  const [row, setRow] = useState<EmployeeRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [resignDate, setResignDate] = useState<Date | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const previewRole = useRole();
  const [accountRole, setAccountRole] = useState("staff");
  const [savingRole, setSavingRole] = useState(false);

  useBreadcrumbTrail(row ? [row.fullName] : []);

  useEffect(() => {
    let alive = true;
    fetchEmployee(employeeId)
      .then((employee) => {
        if (!alive) return;
        setRow(employee);
        setAccountRole(employee?.account?.role ?? "staff");
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setRow(null);
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [employeeId]);

  if (loading) {
    return <Muted>Memuat data karyawan…</Muted>;
  }

  if (!row) {
    return (
      <EmptyState
        title="Karyawan tidak ditemukan"
        description={`Tidak ada karyawan dengan id ${employeeId}.`}
        action={
          <Link href="/human-resources/karyawan">
            <Button variant="secondary">Kembali ke daftar</Button>
          </Link>
        }
      />
    );
  }

  async function resign() {
    const date = (resignDate ?? new Date()).toISOString().slice(0, 10);
    try {
      const updated = await resignEmployee(row!.id, date);
      setRow(updated);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal menandai resign.");
    }
  }

  async function saveRole() {
    setSavingRole(true);
    try {
      await setEmployeeRole(row!.id, accountRole);
      setRow({ ...row!, account: row!.account ? { ...row!.account, role: accountRole } : null });
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gagal mengubah peran.");
    } finally {
      setSavingRole(false);
    }
  }

  const resigned = row.status === "resigned";

  return (
    <>
      <section className="detail-hero">
        <div className="detail-hero__logo">
          <Avatar name={row.fullName} src={row.photo ?? undefined} size="xl" />
        </div>
        <div className="detail-hero__body">
          <h1 className="detail-hero__name">{row.fullName}</h1>
          <span className="detail-hero__legal">
            {row.employeeCode} · {TYPE_LABEL[row.type] ?? row.type} · masuk {row.joinDate}
          </span>
          <div className="detail-hero__chips">
            <Badge tone={STATUS_TONE[row.status] ?? "neutral"} size="sm" dot>
              {STATUS_LABEL[row.status] ?? row.status}
            </Badge>
            {row.account ? <span className="detail-chip">{row.account.email}</span> : null}
            {row.account ? <span className="detail-chip">peran {row.account.role}</span> : null}
          </div>
        </div>
        <div className="detail-hero__actions">
          <Link href="/human-resources/karyawan">
            <Button size="sm" variant="secondary">
              Kembali
            </Button>
          </Link>
        </div>
      </section>

      <div className="detail-grid">
        <section className="detail-panel">
          <div className="detail-panel__head">
            <h2 className="detail-panel__title">Biodata</h2>
            <Muted>employees</Muted>
          </div>
          <ul className="list-rows">
            <li className="flex items-center justify-between gap-3">
              <span>Kode karyawan</span>
              <strong>{row.employeeCode}</strong>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Nama panggilan</span>
              <span>{row.nickname ?? "—"}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>NIK</span>
              <span>{row.nik ?? "—"}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Email</span>
              <span>{row.email ?? "—"}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Telepon</span>
              <span>{row.phone ?? "—"}</span>
            </li>
            <li className="flex items-start justify-between gap-3">
              <span>Alamat</span>
              <span className="text-right">{row.address ?? "—"}</span>
            </li>
          </ul>
        </section>

        <section className="detail-panel">
          <div className="detail-panel__head">
            <h2 className="detail-panel__title">Penempatan & kontrak</h2>
            <Muted>{row.contractType ?? "kontrak belum diisi"}</Muted>
          </div>
          <ul className="list-rows">
            <li className="flex items-center justify-between gap-3">
              <span>Wilayah</span>
              <span className="text-xs">{row.regionId}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Cabang</span>
              <span className="text-xs">{row.branchId ?? "—"}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Departemen</span>
              <span className="text-xs">{row.departmentId ?? "—"}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Posisi</span>
              <span>{row.position ?? "—"}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Shift</span>
              <span className="text-xs">{row.shiftId ?? "—"}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Kontrak berakhir</span>
              <span>{row.contractEndDate ?? "—"}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Tanggal resign</span>
              <span>{row.resignDate ?? "—"}</span>
            </li>
          </ul>
        </section>
      </div>

      {previewRole === "super_admin" ? (
        <Card
          title="Peran akun"
          description="Hanya Super Admin yang boleh mengubah peran. Saat onboarding, akun selalu dibuat sebagai karyawan (staff)."
          meta="RBAC"
          status={row.account?.role ?? "belum ada akun"}
        >
          <div className="flex flex-col gap-3">
            <RadioGroup
              label="Peran"
              options={roles.map((item) => ({ value: item.value, label: item.label }))}
              value={accountRole}
              onValueChange={setAccountRole}
            />
            <div>
              <Button size="sm" onClick={saveRole} loading={savingRole}>
                Simpan peran
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Muted>Peran akun hanya dapat diubah oleh Super Admin.</Muted>
      )}

      {error ? <Alert tone="danger" title={error} /> : null}

      <Card
        title="Manajemen resign"
        description="Menandai resign menutup biodata dan menonaktifkan akun login sekaligus."
        meta="Tidak bisa dibatalkan"
        status={resigned ? `Resign ${row.resignDate ?? ""}` : undefined}
      >
        {resigned ? (
          <Muted>Karyawan ini sudah berstatus resign. Akun login-nya nonaktif.</Muted>
        ) : (
          <div className="flex flex-col gap-3">
            <DatePicker
              label="Tanggal resign"
              value={resignDate}
              onChange={setResignDate}
              locale="id-ID"
              showToday
              description="Kosongkan untuk memakai tanggal hari ini."
            />
            <HoldToConfirm
              label="Tahan untuk tandai resign"
              confirmedLabel="Ditandai resign"
              duration={1200}
              tone="danger"
              onConfirm={resign}
            />
          </div>
        )}
      </Card>
    </>
  );
}