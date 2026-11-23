"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/arc/alert/alert";
import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { Input } from "@/components/arc/input/input";
import { Skeleton } from "@/components/arc/skeleton/skeleton";
import { Card } from "@/components/ui/Card";
import { Muted, Table } from "@/components/ui/Table";
import { apiFetch, apiUrl, copyFor } from "@/lib/api";

type Tab = "recap" | "requests" | "clock";

interface RecapRow {
  employeeCode: string;
  fullName: string;
  periodStart: string;
  periodEnd: string;
  hadirH: number;
  terlambat: number;
  cutiC: number;
  cdt: number;
  alfa: number;
}

interface RequestRow {
  id: string;
  employeeId: string;
  type: string;
  startDate: string;
  endDate: string;
  leaveDays: number;
  reason: string | null;
  overtimeHours: string | null;
  amount: string | null;
  status: string;
  hrValidatedAt: string | null;
}

interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
}
interface Location {
  id: string;
  name: string;
  timezone: string;
}

type Tone = "info" | "success" | "warning" | "danger" | "neutral";
const requestTone: Record<string, Tone> = {
  cuti: "info",
  wfh: "info",
  dinas_luar: "warning",
  sakit: "warning",
  koreksi_absen: "neutral",
  lembur: "success",
  reimbursement: "danger",
};

export function AttendanceWorkspace() {
  // `new Date()` must not run during prerender (cacheComponents).
  const [clock, setClock] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("recap");
  const [period, setPeriod] = useState("");
  const [recap, setRecap] = useState<RecapRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [clockValues, setClockValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    setClock(date);
    setPeriod(date.slice(0, 7));
    setClockValues({ workDate: date, source: "web" });
  }, []);

  const load = useCallback(async (activePeriod: string) => {
    try {
      const [recapData, requestData, employeeData, locationData] = await Promise.all([
        apiFetch<{ recap: RecapRow[] }>(`/attendance/recap?period=${activePeriod}`),
        apiFetch<{ requests: RequestRow[] }>("/attendance/requests"),
        apiFetch<{ employees: Employee[] }>("/people/employees"),
        apiFetch<{ locations: Location[] }>("/master/attendance-locations"),
      ]);
      setRecap(recapData.recap ?? []);
      setRequests(requestData.requests ?? []);
      setEmployees(employeeData.employees ?? []);
      setLocations(locationData.locations ?? []);
      setError(null);
    } catch (caught) {
      setError(copyFor(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!period) return;
    void load(period);
  }, [period, load]);

  const pending = useMemo(() => requests.filter((row) => row.status === "pending"), [requests]);

  async function decide(id: string, approved: boolean) {
    setBusy(id);
    try {
      await apiFetch(`/attendance/requests/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ approved }),
      });
      await load(period);
    } catch (caught) {
      setError(copyFor(caught));
    } finally {
      setBusy(null);
    }
  }

  async function validate(id: string) {
    setBusy(id);
    try {
      await apiFetch(`/attendance/requests/${id}/validate`, { method: "POST", body: JSON.stringify({}) });
      await load(period);
    } catch (caught) {
      setError(copyFor(caught));
    } finally {
      setBusy(null);
    }
  }

  async function clockIn(event: React.FormEvent) {
    event.preventDefault();
    if (!clockValues.employeeId || !clockValues.locationId) return;
    setBusy("clock");
    try {
      await apiFetch("/attendance/clock-in", {
        method: "POST",
        body: JSON.stringify({
          employeeId: clockValues.employeeId,
          locationId: clockValues.locationId,
          workDate: clockValues.workDate,
          source: clockValues.source ?? "web",
          selfieUrl: clockValues.selfieUrl || undefined,
          isMockLocation: clockValues.isMockLocation === "true",
        }),
      });
      await load(period);
      setError(null);
    } catch (caught) {
      setError(copyFor(caught));
    } finally {
      setBusy(null);
    }
  }

  const exportHref = `${apiUrl}/attendance/export.xlsx?period=${period}`;

  return (
    <>
      {error ? (
        <Alert tone="warning" title="Sebagian data tidak termuat" open>
          {error}
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button size="sm" variant={tab === "recap" ? "primary" : "ghost"} onClick={() => setTab("recap")}>
            Rekap cutoff
          </Button>
          <Button size="sm" variant={tab === "requests" ? "primary" : "ghost"} onClick={() => setTab("requests")}>
            Pengajuan {pending.length ? `(${pending.length})` : ""}
          </Button>
          <Button size="sm" variant={tab === "clock" ? "primary" : "ghost"} onClick={() => setTab("clock")}>
            Clock-in
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Input label="Periode" value={period} onChange={(event) => setPeriod(event.target.value)} placeholder="2026-11" />
          <a href={exportHref} target="_blank" rel="noreferrer">
            <Button size="sm" variant="secondary">
              Export .xlsx
            </Button>
          </a>
        </div>
      </div>

      {loading || !clock ? (
        <Card title="Memuat kehadiran" description="Rekap, pengajuan, dan lokasi absensi." meta="HRIS" status="…">
          <Skeleton lines={4} avatar />
        </Card>
      ) : tab === "recap" ? (
        <Card
          title="Rekap cut-off 26 – 25"
          description="Hadir, terlambat, cuti (C), CDT, dan Alfa per karyawan. Angka siap diekspor ke .xlsx untuk Payroll/Finance."
          meta={period}
          status={`${recap.length} karyawan`}
        >
          <Table
            minWidth={680}
            numeric={[1, 2, 3, 4, 5, 6]}
            empty="Belum ada absensi pada siklus ini."
            head={["Karyawan", "H", "Telat", "C", "CDT", "Alfa", "Total"]}
            rows={recap.map((row) => [
              <span key={`${row.employeeCode}-name`}>
                <span className="block font-medium">{row.fullName}</span>
                <Muted>{row.employeeCode}</Muted>
              </span>,
              row.hadirH,
              row.terlambat,
              row.cutiC,
              row.cdt,
              row.alfa,
              row.hadirH + row.terlambat + row.cutiC + row.cdt + row.alfa,
            ])}
          />
        </Card>
      ) : tab === "requests" ? (
        <Card
          title="Pengajuan & approval"
          description="Cuti, WFH, dinas luar, sakit, koreksi absen, lembur, dan reimbursement. Kepala Divisi menyetujui, lalu Admin HR memvalidasi."
          meta="ESS"
          status={`${pending.length} menunggu`}
        >
          {requests.length ? (
            <Table
              minWidth={860}
              empty="Belum ada pengajuan."
              head={["Karyawan", "Jenis", "Tanggal", "Nilai", "Status", "Aksi"]}
              rows={requests.map((row) => {
                const employee = employees.find((entry) => entry.id === row.employeeId);
                const value =
                  row.type === "lembur"
                    ? `${row.overtimeHours ?? "—"} jam`
                    : row.type === "reimbursement"
                      ? `Rp ${Number(row.amount ?? 0).toLocaleString("id-ID")}`
                      : `${row.leaveDays} hari`;
                return [
                  <span key={`${row.id}-who`}>
                    <span className="block font-medium">{employee?.fullName ?? row.employeeId}</span>
                    <Muted>{employee?.employeeCode ?? "—"}</Muted>
                  </span>,
                  <Badge key={`${row.id}-type`} size="sm" pill tone={requestTone[row.type] ?? "neutral"}>
                    {row.type}
                  </Badge>,
                  <span key={`${row.id}-date`} className="text-xs">
                    {row.startDate} → {row.endDate}
                  </span>,
                  <span key={`${row.id}-value`} className="text-xs tabular-nums">
                    {value}
                  </span>,
                  <span key={`${row.id}-status`} className="flex flex-col gap-1">
                    <Badge size="sm" dot tone={row.status === "approved" ? "success" : row.status === "rejected" ? "danger" : "warning"}>
                      {row.status}
                    </Badge>
                    {row.hrValidatedAt ? <Muted>HR ✓</Muted> : null}
                  </span>,
                  <span key={`${row.id}-actions`} className="flex flex-wrap gap-1">
                    {row.status === "pending" ? (
                      <>
                        <Button size="sm" onClick={() => decide(row.id, true)} loading={busy === row.id}>
                          Setuju
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => decide(row.id, false)} disabled={busy === row.id}>
                          Tolak
                        </Button>
                      </>
                    ) : row.status === "approved" && !row.hrValidatedAt ? (
                      <Button size="sm" variant="secondary" onClick={() => validate(row.id)} loading={busy === row.id}>
                        Validasi HR
                      </Button>
                    ) : (
                      <Muted>—</Muted>
                    )}
                  </span>,
                ];
              })}
            />
          ) : (
            <EmptyState title="Belum ada pengajuan" description="Pengajuan dari aplikasi mobile muncul di sini." />
          )}
        </Card>
      ) : (
        <Card
          title="Clock-in manual"
          description="Absensi web memakai lokasi geofence yang sama dengan mobile. Selisih dari jam masuk shift langsung tercatat Terlambat (0 menit)."
          meta="Attendance"
          status={clockValues.workDate ?? ""}
        >
          <form onSubmit={clockIn} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>Karyawan *</span>
                <select
                  className="resource-select"
                  required
                  value={clockValues.employeeId ?? ""}
                  onChange={(event) => setClockValues((current) => ({ ...current, employeeId: event.target.value }))}
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
                <span className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>Lokasi geofence *</span>
                <select
                  className="resource-select"
                  required
                  value={clockValues.locationId ?? ""}
                  onChange={(event) => setClockValues((current) => ({ ...current, locationId: event.target.value }))}
                >
                  <option value="">Pilih lokasi…</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name} · {location.timezone}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                label="Tanggal kerja"
                type="date"
                value={clockValues.workDate ?? ""}
                onChange={(event) => setClockValues((current) => ({ ...current, workDate: event.target.value }))}
              />
              <Input
                label="Selfie URL"
                value={clockValues.selfieUrl ?? ""}
                onChange={(event) => setClockValues((current) => ({ ...current, selfieUrl: event.target.value }))}
                description="Disimpan ke object storage; watermark waktu server."
              />
            </div>
            <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <input
                type="checkbox"
                checked={clockValues.isMockLocation === "true"}
                onChange={(event) => setClockValues((current) => ({ ...current, isMockLocation: String(event.target.checked) }))}
              />
              Tandai sebagai mock location (anti-fake GPS)
            </label>
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" loading={busy === "clock"}>
                Simpan absensi
              </Button>
              <Muted>Zona waktu mengikuti lokasi yang dipilih.</Muted>
            </div>
          </form>
        </Card>
      )}
    </>
  );
}