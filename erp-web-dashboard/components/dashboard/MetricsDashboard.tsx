"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/arc/alert/alert";
import { Badge } from "@/components/arc/badge/badge";
import { BarChart } from "@/components/arc/bar-chart/bar-chart";
import { Button } from "@/components/arc/button/button";
import { DonutChart } from "@/components/arc/donut-chart/donut-chart";
import { DropdownMenu } from "@/components/arc/dropdown-menu/dropdown-menu";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
import { Gauge } from "@/components/arc/gauge/gauge";
import { MetricCard } from "@/components/arc/metric-card/metric-card";
import { Progress } from "@/components/arc/progress/progress";
import { SearchField } from "@/components/arc/search-field/search-field";
import { Skeleton } from "@/components/arc/skeleton/skeleton";
import { Card } from "@/components/ui/Card";
import { Muted, Table } from "@/components/ui/Table";
import { apiFetch, errorCopy } from "@/lib/api";
import { bandColour, buildMetrics, dailySeries, picMixOf, statusMixOf } from "@/lib/metrics";
import type { MatrixRow, MetricsSnapshot, PicSource, RecapLine, UnitKpi } from "@/lib/metrics";
import { deliveryOrders, kpiRows, recap as sampleRecap, sampleMatrix } from "@/lib/sample";

type Metric = "km" | "trips";
type Range = "month" | "week";
type UnitFilter = "all" | "below";
type SortKey = "plate" | "km" | "achievement";

const pad = (value: number) => String(value).padStart(2, "0");

/** PRD data while the API is not answering; the shape matches the endpoints. */
function sampleSnapshot(date: string): MetricsSnapshot {
  const month = date.slice(0, 7);

  const units: UnitKpi[] = kpiRows.map((row, index) => ({
    unitId: `sample-${index}`,
    plateNumber: row.plate,
    driverId: null,
    totalKm: row.totalKm,
    targetKm: row.targetKm,
    totalTrips: row.trips,
    totalNup: row.nup,
    totalStandby: row.standby,
  }));

  const recap: RecapLine[] = sampleRecap.map((row) => ({
    employeeCode: row.code,
    fullName: row.employee,
    hadirH: row.hadir,
    terlambat: row.terlambat,
    cutiC: row.cuti,
    cdt: row.cdt,
    alfa: row.alfa,
  }));

  const matrix: MatrixRow[] = Object.entries(sampleMatrix).flatMap(([plate, cells]) =>
    cells
      .filter((cell) => cell.status)
      .map((cell) => ({
        unitId: plate,
        unitLabel: plate,
        date: `${month}-${pad(cell.day)}`,
        status: cell.status as string,
        km: cell.km ?? null,
        pic: (cell.pic ?? "Operasional") as PicSource,
        info: cell.info ?? null,
      })),
  );

  const requestedUnits = deliveryOrders.reduce((sum, order) => sum + order.units, 0);

  return {
    units,
    recap,
    matrix,
    region: {
      date,
      regionId: null,
      totalKm: units.reduce((sum, unit) => sum + unit.totalKm, 0),
      targetKm: units.reduce((sum, unit) => sum + unit.targetKm, 0),
      workingUnits: units.length,
      requestedUnits,
      fulfilmentRatio: requestedUnits ? Number((units.length / requestedUnits).toFixed(2)) : null,
    },
  };
}

interface KpiResponse {
  kpi?: UnitKpi[];
}
interface RegionResponse {
  dashboard?: MetricsSnapshot["region"];
}
interface RecapResponse {
  recap?: RecapLine[];
}
interface MatrixResponse {
  matrix?: { unitId: string; date: string; status: string; km: number | null; pic: PicSource; info?: string | null }[];
}

/**
 * PRD metrics screen, shaped like Arc's "Metrics dashboard" block:
 * toolbar (range + filters + saved views), KPI tabs over one chart, breakdowns,
 * goals, a sortable table and a detail panel for the selected row.
 *
 * Arc's own screen is Pro-gated, so the anatomy is rebuilt from the free
 * primitives in this repo (MetricCard, BarChart, DonutChart, Gauge, Progress).
 */
export function MetricsDashboard() {
  // `new Date()` is unstable during prerender, so the clock is read in an effect.
  const [clock, setClock] = useState<{ day: number; date: string } | null>(null);
  const [snapshot, setSnapshot] = useState<MetricsSnapshot>(() => sampleSnapshot(""));
  const [source, setSource] = useState<"sample" | "api">("sample");
  const [error, setError] = useState<string | null>(null);

  const [metric, setMetric] = useState<Metric>("km");
  const [range, setRange] = useState<Range>("month");
  const [filter, setFilter] = useState<UnitFilter>("all");
  const [sort, setSort] = useState<SortKey>("achievement");
  const [unitQuery, setUnitQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    setClock({ day: now.getUTCDate(), date: now.toISOString().slice(0, 10) });
  }, []);

  useEffect(() => {
    let alive = true;

    async function load() {
      const now = new Date();
      const date = now.toISOString().slice(0, 10);
      const month = date.slice(0, 7);

      const results = await Promise.allSettled([
        apiFetch<KpiResponse>("/operations/kpi"),
        apiFetch<RegionResponse>("/operations/dashboard/region"),
        apiFetch<RecapResponse>("/attendance/recap"),
        apiFetch<MatrixResponse>(`/operations/matrix?month=${month}`),
      ]);
      if (!alive) return;

      const [kpiResult, regionResult, recapResult, matrixResult] = results;
      const next = sampleSnapshot(date);
      let usedApi = false;

      if (kpiResult.status === "fulfilled" && kpiResult.value.kpi?.length) {
        next.units = kpiResult.value.kpi;
        usedApi = true;
      }
      if (regionResult.status === "fulfilled" && regionResult.value.dashboard) {
        next.region = regionResult.value.dashboard;
        usedApi = true;
      }
      if (recapResult.status === "fulfilled" && recapResult.value.recap?.length) {
        next.recap = recapResult.value.recap;
        usedApi = true;
      }
      if (matrixResult.status === "fulfilled" && matrixResult.value.matrix?.length) {
        const labels = new Map(next.units.map((unit) => [unit.unitId, unit.plateNumber]));
        next.matrix = matrixResult.value.matrix.map((row) => ({
          ...row,
          unitLabel: labels.get(row.unitId) ?? row.unitId,
        }));
        usedApi = true;
      }

      setSnapshot(next);
      setSource(usedApi ? "api" : "sample");
      setError(usedApi ? null : errorCopy.network);
    }

    load().catch(() => {
      if (alive) setError(errorCopy.network);
    });

    return () => {
      alive = false;
    };
  }, []);

  const day = clock?.day ?? 1;
  const view = useMemo(() => buildMetrics(snapshot, day), [snapshot, day]);

  const days = useMemo(() => dailySeries(snapshot.matrix), [snapshot.matrix]);
  const scopedDays = range === "week" ? days.slice(-7) : days;
  const chartData = scopedDays.map((point) => ({
    key: point.key,
    label: `tgl ${point.label}`,
    axisLabel: point.label,
    value: metric === "km" ? point.km : point.trips,
  }));

  const chartTotal = scopedDays.reduce((sum, point) => sum + (metric === "km" ? point.km : point.trips), 0);

  const statusMix = useMemo(() => statusMixOf(snapshot.matrix), [snapshot.matrix]);
  const picMix = useMemo(() => picMixOf(snapshot.matrix), [snapshot.matrix]);
  const attendanceMix = useMemo(() => {
    const totals = view.recap.reduce(
      (sum, line) => ({
        hadir: sum.hadir + line.hadirH,
        terlambat: sum.terlambat + line.terlambat,
        cuti: sum.cuti + line.cutiC,
        cdt: sum.cdt + line.cdt,
        alfa: sum.alfa + line.alfa,
      }),
      { hadir: 0, terlambat: 0, cuti: 0, cdt: 0, alfa: 0 },
    );
    return [
      { key: "H", label: "Hadir", value: totals.hadir },
      { key: "late", label: "Terlambat", value: totals.terlambat },
      { key: "C", label: "Cuti", value: totals.cuti },
      { key: "CDT", label: "CDT", value: totals.cdt },
      { key: "A", label: "Alfa", value: totals.alfa },
    ].filter((entry) => entry.value > 0);
  }, [view.recap]);

  const unitRows = useMemo(() => {
    const needle = unitQuery.trim().toLowerCase();
    const scoped = (filter === "below" ? view.units.filter((unit) => unit.band !== "green") : view.units).filter(
      (unit) => !needle || `${unit.plateNumber} ${unit.unitId}`.toLowerCase().includes(needle),
    );
    return [...scoped].sort((a, b) => {
      if (sort === "plate") return a.plateNumber.localeCompare(b.plateNumber);
      if (sort === "km") return b.totalKm - a.totalKm;
      return b.achievement - a.achievement;
    });
  }, [view.units, filter, sort, unitQuery]);

  const selected = view.units.find((unit) => unit.unitId === selectedId) ?? null;
  const selectedId_ = selected?.unitId;

  if (!clock) {
    return (
      <Card title="Menyiapkan metrik" description="Membaca tanggal berjalan dan data API." meta="Metrics" status="…">
        <Skeleton lines={4} avatar />
      </Card>
    );
  }

  return (
    <>
      {error ? (
        <Alert tone="warning" title="Mode contoh" open>
          {error} Angka di bawah berasal dari data seed sampai API berjalan.
        </Alert>
      ) : null}

      {/* ------------------------------------------------------------ toolbar */}
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={source === "api" ? "success" : "neutral"} dot pill>
            {source === "api" ? "data API" : "data contoh"}
          </Badge>
          <Badge tone="info" pill>
            {view.month}
          </Badge>
          <Muted>hari ke-{view.day} · target berjalan {view.runningTarget}%</Muted>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu
            label={range === "month" ? "Bulan ini" : "7 hari terakhir"}
            items={[
              { label: "Bulan ini", onSelect: () => setRange("month") },
              { label: "7 hari terakhir", onSelect: () => setRange("week") },
            ]}
          />
          <DropdownMenu
            label={filter === "all" ? "Semua unit" : "Di bawah target"}
            items={[
              { label: "Semua unit", onSelect: () => setFilter("all") },
              { label: "Hanya di bawah target", onSelect: () => setFilter("below") },
            ]}
          />
          <DropdownMenu
            label="Urutkan"
            items={[
              { label: "Capaian tertinggi", onSelect: () => setSort("achievement") },
              { label: "KM terbesar", onSelect: () => setSort("km") },
              { label: "Nomor polisi", onSelect: () => setSort("plate") },
            ]}
          />
        </div>
      </section>

      {/* ---------------------------------------------------------------- KPI */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total KM bulan"
          value={Math.round(view.totals.km)}
          suffix=" KM"
          context={`Target ${view.totals.targetKm.toLocaleString("id-ID")} KM · ${view.units.length} unit`}
        />
        <MetricCard
          label="Capaian"
          value={Math.round(view.achievement)}
          suffix="%"
          context={`Target hari ke-${view.day} = ${view.runningTarget}%`}
          change={`${view.gapToTarget >= 0 ? "+" : ""}${view.gapToTarget}%`}
        />
        <MetricCard
          label="Total trip"
          value={view.totals.trips}
          context={`${view.totals.standby} standby · ${view.totals.nup} perbaikan`}
        />
        <MetricCard
          label="DO diminta"
          value={view.region.requestedUnits}
          suffix=" unit"
          context={`${view.region.workingUnits} unit bekerja · gap ${view.region.demandGap}`}
        />
      </section>

      {/* ------------------------------------------------------- chart + goal */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Card
          title="Tren harian"
          description="KPI tabs di atas satu chart. Hanya sel KM yang dihitung; B.M dan A.M tidak masuk total."
          meta={range === "month" ? "Bulan penuh" : "7 hari terakhir"}
          status={`${chartData.length} titik`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <Button size="sm" variant={metric === "km" ? "primary" : "ghost"} onClick={() => setMetric("km")}>
                KM
              </Button>
              <Button size="sm" variant={metric === "trips" ? "primary" : "ghost"} onClick={() => setMetric("trips")}>
                Trip
              </Button>
            </div>
            <Muted>
              Total {chartTotal.toLocaleString("id-ID")} {metric === "km" ? "KM" : "trip"}
            </Muted>
          </div>

          {chartData.length ? (
            <BarChart
              data={chartData}
              label={metric === "km" ? "KM harian" : "Trip harian"}
              period={`${view.month} · per tanggal`}
              unit={metric === "km" ? "KM" : "trip"}
              averageLabel="Rata-rata"
              valueLabel={metric === "km" ? "KM" : "Trip"}
              showAverage
            />
          ) : (
            <EmptyState title="Belum ada matriks" description="Isi status harian di halaman Matriks 1–31." />
          )}
        </Card>

        <Card
          title="Capaian & goal"
          description={`Target tanggal berjalan ${view.runningTarget}% (hari ${view.day}).`}
          meta="KPI"
          status={`${view.units.length} unit`}
        >
          <Gauge value={Math.round(view.achievement)} min={0} max={100} label="Capaian" detail={`Target ${view.runningTarget}%`} />
          <div className="flex flex-col">
            {view.units.slice(0, 3).map((unit) => (
              <div key={unit.unitId} className="flex flex-col gap-1 py-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{unit.plateNumber}</span>
                  <span style={{ color: bandColour[unit.band] }}>{unit.achievement}%</span>
                </div>
                <Progress value={Math.min(100, unit.achievement)} />
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* ---------------------------------------------------------- breakdown */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card
          title="Status unit"
          description="Frekuensi kode status pada matriks bulan ini."
          meta="Breakdown"
          status={`${statusMix.length} status`}
        >
          {statusMix.length ? (
            <DonutChart data={statusMix} label="Komposisi status unit" unit="sel" totalLabel="Total" />
          ) : (
            <EmptyState title="Belum ada status" description="Status muncul setelah matriks diisi." />
          )}
        </Card>

        <Card
          title="PIC"
          description="Operasional (Korlap) vs Marketing/Alam — hanya Admin Sistem yang boleh mengubah."
          meta="Breakdown"
          status={`${picMix.length} sumber`}
        >
          {picMix.length ? (
            <DonutChart data={picMix} label="Komposisi PIC" unit="sel" totalLabel="Total" />
          ) : (
            <EmptyState title="Belum ada PIC" description="PIC terisi otomatis saat matriks diperbarui." />
          )}
        </Card>

        <Card
          title="Kehadiran"
          description="Rekap cutoff 26–25 untuk seluruh karyawan pada snapshot ini."
          meta="HRIS"
          status={`${view.recap.length} karyawan`}
        >
          {attendanceMix.length ? (
            <DonutChart data={attendanceMix} label="Komposisi kehadiran" unit="catatan" totalLabel="Total" />
          ) : (
            <EmptyState title="Belum ada absensi" description="Rekap muncul setelah clock-in tercatat." />
          )}
        </Card>
      </section>

      {/* ------------------------------------------------- table + detail panel */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Card
          title="KPI per unit"
          description="Klik baris untuk membuka detail unit. Urutan mengikuti kontrol di toolbar."
          meta="Matriks operasional"
          status={`${unitRows.length} unit`}
          action={
            <div className="card-toolbar">
              <SearchField
                label="Cari unit"
                placeholder="Cari nomor polisi…"
                value={unitQuery}
                onValueChange={setUnitQuery}
              />
            </div>
          }
        >
          <Table
            minWidth={620}
            numeric={[1, 2, 3, 4, 5]}
            head={["Unit", "KM", "Target", "Capaian", "Trip", "NUP", "S.T"]}
            empty="Tidak ada unit yang cocok dengan filter."
            selectedRow={unitRows.findIndex((unit) => unit.unitId === selectedId_)}
            onRowClick={(index) => {
              const row = unitRows[index];
              if (row) setSelectedId(row.unitId === selectedId_ ? null : row.unitId);
            }}
            rows={unitRows.map((unit) => [
              <span key={`${unit.unitId}-unit`}>
                <span className="block font-medium">{unit.plateNumber}</span>
                <Muted>{unit.achievement}% dari target</Muted>
              </span>,
              unit.totalKm.toLocaleString("id-ID"),
              unit.targetKm.toLocaleString("id-ID"),
              <span
                key={`${unit.unitId}-band`}
                className="rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{
                  background: `color-mix(in oklab, ${bandColour[unit.band]} 16%, transparent)`,
                  color: bandColour[unit.band],
                }}
              >
                {unit.band}
              </span>,
              unit.totalTrips,
              unit.totalNup,
              unit.totalStandby,
            ])}
          />
        </Card>

        <Card
          title={selected ? selected.plateNumber : "Detail unit"}
          description={
            selected
              ? "Ringkasan unit terpilih, lengkap dengan sisa jarak ke target bulan ini."
              : "Pilih satu baris di tabel untuk melihat detailnya di sini."
          }
          meta={selected ? "Detail" : "—"}
          status={selected ? `${selected.achievement}%` : "belum dipilih"}
        >
          {selected ? (
            <>
              <div className="flex items-center gap-2">
                <Badge tone={selected.band === "green" ? "success" : selected.band === "cream" ? "warning" : "danger"} dot pill>
                  {selected.band}
                </Badge>
                <Muted>
                  {selected.totalKm.toLocaleString("id-ID")} / {selected.targetKm.toLocaleString("id-ID")} KM
                </Muted>
              </div>
              <Progress value={Math.min(100, selected.achievement)} label="Capaian terhadap target bulan" showValue />
              <div className="flex flex-col">
                <div className="stat-row">
                  <span className="stat-row__label">Sisa ke target</span>
                  <span className="stat-row__value">
                    {Math.max(0, selected.targetKm - selected.totalKm).toLocaleString("id-ID")} KM
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-row__label">Trip · NUP · S.T</span>
                  <span className="stat-row__value">
                    {selected.totalTrips} · {selected.totalNup} · {selected.totalStandby}
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-row__label">Catatan lapangan</span>
                  <span className="stat-row__value">
                    {snapshot.matrix.filter((row) => row.unitId === selected.unitId && row.info).slice(-1)[0]?.info ?? "—"}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              title="Belum ada unit dipilih"
              description="Tabel di sebelah kiri bisa diklik per baris."
              action={
                <Button size="sm" variant="secondary" onClick={() => setSelectedId(view.units[0]?.unitId ?? null)}>
                  Pilih unit pertama
                </Button>
              }
            />
          )}
        </Card>
      </section>

      <Muted>
        {unitRows.length} unit ditampilkan · rumus PRD §D: capaian = KM ÷ target · target berjalan = ⌈tgl × 3,33%⌉
      </Muted>
    </>
  );
}