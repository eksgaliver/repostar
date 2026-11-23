import type { Metadata } from "next";
import { Badge } from "@/components/arc/badge/badge";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/Table";
import { band, bandColour, kpiRows, matrixDays, runningTarget, sampleMatrix } from "@/lib/sample";

export const metadata: Metadata = { title: "Matriks operasional · S.T.A.R.S" };

const ORANGE = new Set(["P.M", "P.B", "A.B", "TR", "TPR"]);
const BLUE = new Set(["NUP", "NUPL", "S.T"]);
const GRAY = new Set(["PART", "HUJAN", "TAS", "C"]);
const RED = new Set(["REJECT", "INSIDEN"]);

/** PRD section D.3: colour follows the status, then the PIC override wins. */
function cellColour(status: string | null | undefined, pic?: "Operasional" | "Marketing/Alam") {
  if (!status) return { background: "transparent", color: "var(--text-muted)", border: "var(--border-subtle)" };
  if (pic === "Marketing/Alam" && ["S.T", "A.M", "B.M"].includes(status)) {
    return { background: "color-mix(in oklab, var(--warning) 18%, transparent)", color: "var(--warning)", border: "var(--warning)" };
  }
  if (RED.has(status)) return { background: "color-mix(in oklab, var(--danger) 16%, transparent)", color: "var(--danger)", border: "var(--danger)" };
  if (GRAY.has(status)) return { background: "var(--surface-muted)", color: "var(--text-muted)", border: "var(--border)" };
  if (BLUE.has(status)) return { background: "color-mix(in oklab, var(--info) 14%, transparent)", color: "var(--info)", border: "var(--info)" };
  if (ORANGE.has(status)) return { background: "color-mix(in oklab, var(--warning) 14%, transparent)", color: "var(--warning)", border: "var(--warning)" };
  return { background: "var(--surface)", color: "var(--foreground)", border: "var(--border)" };
}

const today = new Date().getUTCDate();
const target = runningTarget(today);

export default function MatrixPage() {
  return (
    <>
      <PageHeader
        title="Workspace Matriks Operasional"
        description="Kolom tanggal 1 sampai akhir bulan per unit. Setiap sel menyimpan kode status, KM, PIC, informasi lapangan, dan tindak lanjut."
        aside={
          <>
            <Badge tone="info" pill>
              31 kolom
            </Badge>
            <Badge size="sm" tone={band(90, target) === "green" ? "success" : "warning"} dot pill>
              target hari ini {target}%
            </Badge>
          </>
        }
      />

      <Card
        title="Matriks bulan ini"
        description="Angka KM pada B.M dan A.M tidak dihitung ke total. Hanya sel KM yang menambah total KM dan total trip."
        meta="Operasional"
        status={`${Object.keys(sampleMatrix).length} unit`}
      >
        <div
          className="w-full overflow-x-auto"
          style={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--surface)" }}
        >
          <table className="min-w-max text-xs">
            <thead>
              <tr style={{ color: "var(--text-muted)" }}>
                <th className="sticky left-0 z-10 px-2 py-2 text-left font-medium" style={{ background: "var(--surface)" }}>
                  Unit
                </th>
                {matrixDays.map((day) => (
                  <th key={day} className="px-1 py-2 text-center font-medium tabular-nums">
                    {day}
                  </th>
                ))}
                <th className="px-2 py-2 text-right font-medium">KM</th>
                <th className="px-2 py-2 text-right font-medium">Trip</th>
                <th className="px-2 py-2 text-right font-medium">NUP</th>
                <th className="px-2 py-2 text-right font-medium">S.T</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(sampleMatrix).map(([plate, cells]) => {
                const byDay = new Map(cells.map((cell) => [cell.day, cell]));
                const totalKm = cells.reduce((sum, cell) => sum + (cell.status === "KM" ? cell.km ?? 0 : 0), 0);
                const trips = cells.filter((cell) => cell.status === "KM").length;
                const nup = cells.filter((cell) => cell.status === "NUP").length;
                const standby = cells.filter((cell) => cell.status === "S.T").length;
                return (
                  <tr key={plate} className="border-t" style={{ borderColor: "var(--border-subtle)" }}>
                    <td
                      className="sticky left-0 z-10 whitespace-nowrap px-2 py-2 font-medium"
                      style={{ background: "var(--surface)" }}
                    >
                      {plate}
                    </td>
                    {matrixDays.map((day) => {
                      const cell = byDay.get(day);
                      const colour = cellColour(cell?.status, cell?.pic);
                      return (
                        <td key={day} className="p-0.5">
                          <div
                            title={cell?.info ?? cell?.status ?? "kosong"}
                            className="flex h-8 w-8 items-center justify-center rounded-md border text-[10px] font-medium"
                            style={{ background: colour.background, color: colour.color, borderColor: colour.border }}
                          >
                            {cell?.status ?? "·"}
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-2 py-2 text-right tabular-nums">{totalKm}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{trips}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{nup}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{standby}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card
          title="KPI & warna performa"
          description="Capaian = total KM supir / target KM unit. Hijau ≥ target tanggal berjalan, cream 80–99%, merah < 80%."
          meta="Perhitungan"
          status={`hari ke-${today}`}
        >
          <div className="flex flex-col gap-3 text-sm">
            {kpiRows.map((row) => {
              const percent = Number(((row.totalKm / row.targetKm) * 100).toFixed(1));
              const tone = band(percent, target);
              return (
                <div key={row.plate} className="flex items-center justify-between gap-3">
                  <span className="flex flex-col">
                    <span className="font-medium">{row.plate}</span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {row.totalKm.toLocaleString("id-ID")} / {row.targetKm.toLocaleString("id-ID")} KM
                    </span>
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{
                      background: `color-mix(in oklab, ${bandColour[tone]} 16%, transparent)`,
                      color: bandColour[tone],
                    }}
                  >
                    {percent}%
                  </span>
                </div>
              );
            })}
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Target tanggal berjalan = ⌈ tanggal × 3,33% ⌉ → hari {today} = {target}%.
            </p>
          </div>
        </Card>

        <Card
          title="PIC & tindak lanjut"
          description="PIC otomatis Operasional saat Korlap memperbarui status. Hanya Admin Sistem yang boleh mengubahnya menjadi Marketing/Alam."
          meta="Aturan"
          status="2 sumber"
        >
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge size="sm" pill tone="info">
                Operasional
              </Badge>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                NUP, NUPL, S.T
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge size="sm" pill tone="warning">
                Marketing/Alam
              </Badge>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                S.T, A.M, B.M
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge size="sm" pill>
                PART
              </Badge>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                abu-abu, menunggu sparepart
              </span>
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Kolom tindak lanjut: Problem (Admin Sistem), Solusi (Manajemen), SOP (Manajemen).
            </p>
          </div>
        </Card>
      </section>

      <Card
        title="Informasi lapangan"
        description="Catatan dengan badge otomatis: Korlap bila diisi Koordinator Lapangan, Manajemen bila diisi Admin Sistem."
        meta="Audit"
        status="2 catatan"
      >
        <div className="flex flex-col gap-3 text-sm">
          {[
            { unit: "BM 8842 RA", day: 3, info: "Menunggu DO berikutnya", source: "Korlap" as const },
            { unit: "BM 9011 RA", day: 6, info: "Tabrakan ringan di KM 42", source: "Manajemen" as const },
          ].map((note) => (
            <div key={`${note.unit}-${note.day}`} className="flex items-start justify-between gap-3">
              <span className="flex flex-col">
                <span className="font-medium">
                  {note.unit} · tanggal {note.day}
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {note.info}
                </span>
              </span>
              <Badge size="sm" pill tone={note.source === "Korlap" ? "info" : "neutral"}>
                {note.source}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}