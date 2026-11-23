"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/arc/alert/alert";
import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { Input } from "@/components/arc/input/input";
import { MetricCard } from "@/components/arc/metric-card/metric-card";
import { Skeleton } from "@/components/arc/skeleton/skeleton";
import { Card } from "@/components/ui/Card";
import { Muted, Table } from "@/components/ui/Table";
import { apiFetch, copyFor } from "@/lib/api";

interface Membership {
  companyId: string;
  code: string;
  name: string;
  role: string;
  isDefault: boolean;
}

interface ConsolidationRow {
  id: string;
  code: string;
  name: string;
  headcount: number;
  fleet: number;
  presentToday: number;
  attendanceRate: number | null;
  totalKmToday: number;
}

interface DirectoryRow {
  id: string;
  code: string;
  fullName: string;
  type: string;
  isFieldCoordinator: boolean;
  company: { id: string; code: string; name: string };
  regionName: string;
  phone: string | null;
}

interface Secondment {
  id: string;
  employeeId: string;
  fromCompanyId: string;
  toCompanyId: string;
  kind: string;
  startDate: string;
  endDate: string | null;
  status: string;
}

interface SharingRule {
  id: string;
  companyId: string;
  partnerCompanyId: string;
  allowSummary: boolean;
  allowFleet: boolean;
  allowDirectory: boolean;
  allowOa: boolean;
  allowPersonal: boolean;
}

const STEP: Record<string, string> = {
  pending_from: "HR asal",
  pending_to: "HR tujuan",
  pending_super: "Super Admin",
};

export function PortalWorkspace() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeCompany, setActiveCompany] = useState<string | null>(null);
  const [consolidation, setConsolidation] = useState<ConsolidationRow[]>([]);
  const [directory, setDirectory] = useState<DirectoryRow[]>([]);
  const [secondments, setSecondments] = useState<Secondment[]>([]);
  const [sharing, setSharing] = useState<SharingRule[]>([]);
  const [employees, setEmployees] = useState<{ id: string; employeeCode: string; fullName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const results = await Promise.allSettled([
      apiFetch<{ companies: Membership[] }>("/portal/companies"),
      apiFetch<{ companies: ConsolidationRow[] }>("/portal/consolidation"),
      apiFetch<{ directory: DirectoryRow[] }>("/portal/directory?type=D"),
      apiFetch<{ secondments: Secondment[] }>("/portal/secondments"),
      apiFetch<{ rules: SharingRule[] }>("/portal/sharing"),
      apiFetch<{ employees: { id: string; employeeCode: string; fullName: string }[] }>("/people/employees"),
    ]);

    const [memberResult, consolidationResult, directoryResult, secondmentResult, sharingResult, employeeResult] = results;
    const problems: string[] = [];
    const read = <T,>(result: PromiseSettledResult<T>, apply: (value: T) => void) => {
      if (result.status === "fulfilled") apply(result.value);
      else problems.push(copyFor(result.reason));
    };

    read(memberResult, (value) => {
      setMemberships(value.companies ?? []);
      setActiveCompany((current) => current ?? value.companies?.[0]?.companyId ?? null);
    });
    read(consolidationResult, (value) => setConsolidation(value.companies ?? []));
    read(directoryResult, (value) => setDirectory(value.directory ?? []));
    read(secondmentResult, (value) => setSecondments(value.secondments ?? []));
    read(sharingResult, (value) => setSharing(value.rules ?? []));
    read(employeeResult, (value) => setEmployees(value.employees ?? []));

    setError(problems[0] ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const active = useMemo(() => memberships.find((row) => row.companyId === activeCompany) ?? null, [memberships, activeCompany]);
  const totals = useMemo(
    () =>
      consolidation.reduce(
        (sum, row) => ({
          headcount: sum.headcount + row.headcount,
          fleet: sum.fleet + row.fleet,
          present: sum.present + row.presentToday,
          km: sum.km + row.totalKmToday,
        }),
        { headcount: 0, fleet: 0, present: 0, km: 0 },
      ),
    [consolidation],
  );

  const companyLabel = (id: string) => memberships.find((row) => row.companyId === id)?.code ?? id;
  const employeeLabel = (id: string) => {
    const employee = employees.find((row) => row.id === id);
    return employee ? `${employee.employeeCode} · ${employee.fullName}` : id;
  };

  async function createSecondment(event: React.FormEvent) {
    event.preventDefault();
    setBusy("create");
    try {
      await apiFetch("/portal/secondments", {
        method: "POST",
        body: JSON.stringify({
          employeeId: form.employeeId,
          fromCompanyId: form.fromCompanyId,
          toCompanyId: form.toCompanyId,
          startDate: form.startDate,
          endDate: form.endDate || undefined,
          reason: form.reason || undefined,
          kind: form.kind || "secondment",
        }),
      });
      setForm({});
      await load();
    } catch (caught) {
      setError(copyFor(caught));
    } finally {
      setBusy(null);
    }
  }

  async function decideSecondment(id: string, approved: boolean) {
    setBusy(id);
    try {
      await apiFetch(`/portal/secondments/${id}/approve`, { method: "POST", body: JSON.stringify({ approved }) });
      await load();
    } catch (caught) {
      setError(copyFor(caught));
    } finally {
      setBusy(null);
    }
  }

  async function toggleSharing(rule: SharingRule, field: "allowOa" | "allowPersonal") {
    setBusy(rule.id);
    try {
      await apiFetch("/portal/sharing", {
        method: "POST",
        body: JSON.stringify({
          companyId: rule.companyId,
          partnerCompanyId: rule.partnerCompanyId,
          allowSummary: rule.allowSummary,
          allowFleet: rule.allowFleet,
          allowDirectory: rule.allowDirectory,
          allowOa: field === "allowOa" ? !rule.allowOa : rule.allowOa,
          allowPersonal: field === "allowPersonal" ? !rule.allowPersonal : rule.allowPersonal,
        }),
      });
      await load();
    } catch (caught) {
      setError(copyFor(caught));
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <Card title="Memuat portal" description="Company switcher, direktori, dan konsolidasi grup." meta="Portal" status="…">
        <Skeleton lines={4} avatar />
      </Card>
    );
  }

  return (
    <>
      {error ? (
        <Alert tone="warning" title="Sebagian data portal tidak termuat" open>
          {error}
        </Alert>
      ) : null}

      <Card
        title="Company switcher"
        description="Pindah ruang kerja tanpa login ulang. Daftar ini berasal dari company_memberships milik akun Anda."
        meta="SSO"
        status={active ? `aktif: ${active.code}` : "—"}
      >
        <div className="flex flex-wrap gap-2">
          {memberships.length ? (
            memberships.map((membership) => (
              <Button
                key={membership.companyId}
                size="sm"
                variant={membership.companyId === activeCompany ? "primary" : "secondary"}
                onClick={() => setActiveCompany(membership.companyId)}
              >
                {membership.code} · {membership.name}
              </Button>
            ))
          ) : (
            <Muted>Belum ada penugasan perusahaan untuk akun ini.</Muted>
          )}
        </div>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Populasi karyawan" value={totals.headcount} context={`${consolidation.length} perusahaan`} />
        <MetricCard label="Armada" value={totals.fleet} context="unit terdaftar di grup" />
        <MetricCard label="Hadir hari ini" value={totals.present} context="dari absensi tercatat" />
        <MetricCard label="KM hari ini" value={totals.km} suffix=" KM" context="agregat grup" />
      </section>

      <Card
        title="Dashboard konsolidasi grup"
        description="Executive view untuk Super Admin dan Admin read-only: populasi, kehadiran, armada, dan KM per perusahaan."
        meta="Exec"
        status={`${consolidation.length} tenant`}
      >
        <Table
          minWidth={720}
          numeric={[2, 3, 4, 5, 6]}
          empty="Belum ada perusahaan aktif."
          head={["Perusahaan", "Kode", "Karyawan", "Armada", "Hadir", "Rate", "KM"]}
          rows={consolidation.map((row) => [
            <span key={`${row.id}-name`}>
              <span className="block font-medium">{row.name}</span>
              <Muted>{row.id === activeCompany ? "workspace aktif" : "—"}</Muted>
            </span>,
            row.code,
            row.headcount,
            row.fleet,
            row.presentToday,
            row.attendanceRate != null ? `${row.attendanceRate}%` : "—",
            row.totalKmToday,
          ])}
        />
      </Card>

      <Card
        title="Direktori SDM lintas perusahaan"
        description="Hanya supir/mekanik yang statusnya aktif. Nomor telepon hanya tampil bila aturan sharing mengizinkan data personal."
        meta="Secondment"
        status={`${directory.length} orang`}
      >
        {directory.length ? (
          <Table
            minWidth={720}
            empty="Belum ada data direktori."
            head={["ID", "Nama", "Perusahaan", "Wilayah", "Telepon"]}
            rows={directory.map((row) => [
              <code key={`${row.id}-code`} className="text-xs">
                {row.code}
              </code>,
              <span key={`${row.id}-name`}>
                <span className="block font-medium">{row.fullName}</span>
                <Muted>{row.isFieldCoordinator ? "Korlap" : row.type}</Muted>
              </span>,
              <span key={`${row.id}-company`}>
                {row.company.code}
                <Muted> · {row.company.name}</Muted>
              </span>,
              row.regionName,
              row.phone ?? <Badge key={`${row.id}-locked`} size="sm" tone="neutral">terkunci</Badge>,
            ])}
          />
        ) : (
          <EmptyState title="Direktori kosong" description="Aktifkan allowDirectory pada aturan sharing antar perusahaan." />
        )}
      </Card>

      <Card
        title="Mutasi / peminjaman SDM"
        description="Alur approval bertingkat: HR asal → HR tujuan → Super Admin. Biodata inti tidak diduplikasi."
        meta="Secondment"
        status={`${secondments.filter((row) => row.status.startsWith("pending")).length} menunggu`}
      >
        <form onSubmit={createSecondment} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>Karyawan *</span>
              <select
                className="resource-select"
                required
                value={form.employeeId ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, employeeId: event.target.value }))}
              >
                <option value="">Pilih karyawan…</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.employeeCode} · {employee.fullName}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>Jenis</span>
              <select className="resource-select" value={form.kind ?? "secondment"} onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value }))}>
                <option value="secondment">Peminjaman (secondment)</option>
                <option value="mutation">Mutasi permanen</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>Dari perusahaan *</span>
              <select className="resource-select" required value={form.fromCompanyId ?? ""} onChange={(event) => setForm((current) => ({ ...current, fromCompanyId: event.target.value }))}>
                <option value="">Pilih…</option>
                {memberships.map((row) => (
                  <option key={row.companyId} value={row.companyId}>
                    {row.code} · {row.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>Ke perusahaan *</span>
              <select className="resource-select" required value={form.toCompanyId ?? ""} onChange={(event) => setForm((current) => ({ ...current, toCompanyId: event.target.value }))}>
                <option value="">Pilih…</option>
                {memberships.map((row) => (
                  <option key={row.companyId} value={row.companyId}>
                    {row.code} · {row.name}
                  </option>
                ))}
              </select>
            </label>
            <Input label="Mulai *" type="date" required value={form.startDate ?? ""} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} />
            <Input label="Selesai" type="date" value={form.endDate ?? ""} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} />
            <Input label="Alasan" value={form.reason ?? ""} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} />
          </div>
          <Button type="submit" size="sm" loading={busy === "create"}>
            Ajukan
          </Button>
        </form>

        {secondments.length ? (
          <Table
            minWidth={820}
            empty="Belum ada pengajuan mutasi."
            head={["Karyawan", "Rute perusahaan", "Mulai", "Status", "Aksi"]}
            rows={secondments.map((row) => [
              <span key={`${row.id}-who`}>
                <span className="block font-medium">{employeeLabel(row.employeeId)}</span>
                <Muted>{row.kind}</Muted>
              </span>,
              <span key={`${row.id}-route`} className="text-xs">
                {companyLabel(row.fromCompanyId)} → {companyLabel(row.toCompanyId)}
              </span>,
              row.startDate,
              <Badge
                key={`${row.id}-status`}
                size="sm"
                dot
                tone={row.status === "approved" ? "success" : row.status === "rejected" ? "danger" : "warning"}
              >
                {STEP[row.status] ?? row.status}
              </Badge>,
              <span key={`${row.id}-actions`} className="flex flex-wrap gap-1">
                {row.status.startsWith("pending") ? (
                  <>
                    <Button size="sm" loading={busy === row.id} onClick={() => decideSecondment(row.id, true)}>
                      Setujui
                    </Button>
                    <Button size="sm" variant="ghost" disabled={busy === row.id} onClick={() => decideSecondment(row.id, false)}>
                      Tolak
                    </Button>
                  </>
                ) : (
                  <Muted>selesai</Muted>
                )}
              </span>,
            ])}
          />
        ) : (
          <EmptyState title="Belum ada pengajuan" description="Form di atas membuat pengajuan mutasi/peminjaman." />
        )}
      </Card>

      <Card
        title="Izin berbagi data"
        description="Ringkasan, armada, dan direktori boleh dibuka; OA dan biodata sensitif terkunci secara default."
        meta="Granular"
        status={`${sharing.length} aturan`}
      >
        {sharing.length ? (
          <Table
            minWidth={820}
            empty="Belum ada aturan."
            head={["Perusahaan", "Mitra", "Summary", "Armada", "Direktori", "OA", "Personal"]}
            rows={sharing.map((rule) => [
              <span key={`${rule.id}-a`}>{companyLabel(rule.companyId)}</span>,
              <span key={`${rule.id}-b`}>{companyLabel(rule.partnerCompanyId)}</span>,
              <Badge key={`${rule.id}-s`} size="sm" tone={rule.allowSummary ? "success" : "neutral"}>{rule.allowSummary ? "on" : "off"}</Badge>,
              <Badge key={`${rule.id}-f`} size="sm" tone={rule.allowFleet ? "success" : "neutral"}>{rule.allowFleet ? "on" : "off"}</Badge>,
              <Badge key={`${rule.id}-d`} size="sm" tone={rule.allowDirectory ? "success" : "neutral"}>{rule.allowDirectory ? "on" : "off"}</Badge>,
              <Button key={`${rule.id}-oa`} size="sm" variant="ghost" loading={busy === rule.id} onClick={() => toggleSharing(rule, "allowOa")}>
                {rule.allowOa ? "Kunci OA" : "Buka OA"}
              </Button>,
              <Button key={`${rule.id}-p`} size="sm" variant="ghost" disabled={busy === rule.id} onClick={() => toggleSharing(rule, "allowPersonal")}>
                {rule.allowPersonal ? "Kunci personal" : "Buka personal"}
              </Button>,
            ])}
          />
        ) : (
          <EmptyState title="Belum ada aturan" description="Jalankan db:seed untuk membuat aturan WMPL ↔ mitra." />
        )}
      </Card>
    </>
  );
}