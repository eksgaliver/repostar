import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import {
  Badge,
  Card,
  EmptyState,
  MetricCard,
  Progress,
  Row,
  Screen,
  SectionTitle,
  Stack,
  Text,
  useTokens,
} from "@/components/arc";

/**
 * Dedicated WMPL workspace for mobile - mirrors `erp-web-dashboard/src/app/wmpl`.
 * The same payload comes from `GET /company/wmpl`; until the device talks to the
 * API these numbers are the seeded sample.
 */
const WMPL = {
  legalName: "Wijaya Manggala Premier Lestari",
  code: "WMPL",
  timezone: "Asia/Jakarta",
  headcount: { total: 128, staff: 74, drivers: 42, mechanics: 12 },
  fleet: { total: 42, active: 38, tas: 4 },
  operations: { date: "hari ini", totalKm: 5940, workingUnits: 38, standby: 3, workshop: 2, requestedUnits: 13, pendingOa: 1 },
  regions: [
    { code: "PK", name: "Riau", timezone: "WIB", branches: ["Pekanbaru", "Dumai"] },
    { code: "KT", name: "Kalimantan Timur", timezone: "WITA", branches: ["Bontang", "Melak", "Labanan"] },
    { code: "KH", name: "Kalimantan Tengah", timezone: "WIB", branches: ["Sampit"] },
    { code: "KB", name: "Kalimantan Barat", timezone: "WIB", branches: ["Sambas", "Ketapang"] },
  ],
  departments: ["Akunting", "Finance", "Legal", "Pajak", "HRD", "Relation", "Marketing", "Operasional", "Pembelian", "Gudang", "Maintenance"],
  bulletins: [
    { id: "b1", title: "Cutoff November ditutup tanggal 25", body: "Pastikan status matriks tanggal 1–25 terisi sebelum dikunci HRD." },
    { id: "b2", title: "Unit TAS wajib dilaporkan", body: "Korlap melaporkan unit tanpa supir setiap pukul 17:00." },
  ],
};

export function WmplScreen() {
  const token = useTokens();

  return (
    <Screen>
      <Stack gap={4}>
        <Text role="display" weight="700">WMPL</Text>
        <Text role="caption" color={token.textSecondary}>{WMPL.legalName}</Text>
      </Stack>

      <Row gap={8} style={{ flexWrap: "wrap" }}>
        <Badge label="TENANT BAWAAN" tone="success" dot />
        <Badge label={WMPL.timezone} tone="info" />
        <Badge label={`${WMPL.regions.length} wilayah`} />
      </Row>

      <Row gap={10} align="flex-start">
        <MetricCard
          label="Karyawan aktif"
          value={String(WMPL.headcount.total)}
          hint={`${WMPL.headcount.staff} staff · ${WMPL.headcount.drivers} supir · ${WMPL.headcount.mechanics} mekanik`}
        />
        <MetricCard
          label="Armada"
          value={`${WMPL.fleet.active}/${WMPL.fleet.total}`}
          hint={`${WMPL.fleet.tas} unit TAS`}
        />
      </Row>

      <Card title="Operasional hari ini" description="Rekap seluruh unit WMPL" meta="Operations" status={WMPL.operations.date}>
        <Stack gap={10}>
          <MetricCard label="Total KM" value={WMPL.operations.totalKm.toLocaleString("id-ID")} hint={`${WMPL.operations.workingUnits} unit bekerja`} />
          <Progress value={Math.round((WMPL.operations.workingUnits / WMPL.fleet.active) * 100)} label="Unit bekerja vs armada aktif" tone="success" />
          <Row gap={12}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text role="caption">Standby (S.T)</Text>
              <Text weight="600">{WMPL.operations.standby} unit</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text role="caption">Perbaikan</Text>
              <Text weight="600">{WMPL.operations.workshop} unit</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text role="caption">DO menunggu OA</Text>
              <Text weight="600" color={token.warning}>{WMPL.operations.pendingOa} DO</Text>
            </View>
          </Row>
        </Stack>
      </Card>

      <Card title="Wilayah & cabang" description="Timezone mengikuti lokasi absensi" meta="Master data" status={`${WMPL.regions.length} wilayah`}>
        <Stack gap={12}>
          {WMPL.regions.map((region) => (
            <View key={region.code} style={{ flexDirection: "row", gap: 12 }}>
              <Badge label={region.code} tone="info" pill />
              <View style={{ flex: 1, gap: 2 }}>
                <Text weight="600">{region.name}</Text>
                <Text role="caption">{region.branches.join(" · ")}</Text>
              </View>
              <Text role="caption" color={token.textMuted}>{region.timezone}</Text>
            </View>
          ))}
        </Stack>
      </Card>

      <Card title="Departemen" description="Setiap divisi punya Kepala Divisi dan Staff" meta="Organisasi" status={`${WMPL.departments.length} divisi`}>
        <Row gap={6} style={{ flexWrap: "wrap" }}>
          {WMPL.departments.map((department) => (
            <Badge key={department} label={department} />
          ))}
        </Row>
      </Card>

      <SectionTitle title="Internal bulletin" hint="Tayang setelah disetujui HRD" />
      {WMPL.bulletins.length === 0 ? (
        <EmptyState title="Belum ada bulletin" description="Posting Kepala Divisi akan muncul di sini setelah HRD menyetujui." />
      ) : (
        <Stack gap={10}>
          {WMPL.bulletins.map((bulletin) => (
            <Card key={bulletin.id} title={bulletin.title} description={bulletin.body} meta="HRD" status="tayang" />
          ))}
        </Stack>
      )}

      <Text role="caption" color={token.textMuted}>
        Data yang sama tersedia di GET /company/wmpl (erp-backend-api) dan halaman /wmpl di web.
      </Text>
    </Screen>
  );
}

export default WmplScreen;

/** Keeps the status bar style consistent when this screen is the first mount. */
export const WmplStatusBar = () => <StatusBar style="auto" />;