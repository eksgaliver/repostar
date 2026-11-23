import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { View } from "react-native";
import {
  ArcProvider,
  Badge,
  BarChart,
  BottomSheet,
  Button,
  Card,
  Chip,
  ChipGroup,
  DataTable,
  Dialog,
  DonutChart,
  Gauge,
  Input,
  MetricCard,
  Progress,
  Row,
  SearchField,
  Screen,
  SectionTitle,
  SegmentedControl,
  Stat,
  Stack,
  Switch,
  Text,
  Textarea,
  ToastStack,
  useToasts,
  useTokens,
} from "@/components/arc";
import { WmplScreen } from "@/screens/WmplScreen";

const matrix = [
  { unit: "BM 8842 RA", driver: "Andi Saputra", km: 5940, trips: 45, tone: "cream" as const },
  { unit: "BM 9011 RA", driver: "Budi Hartono", km: 7920, trips: 60, tone: "green" as const },
];

function ScreenTitle({ title, subtitle }: { title: string; subtitle: string }) {
  const token = useTokens();
  return (
    <View style={{ gap: 4 }}>
      <Text role="display" weight="700">{title}</Text>
      <Text role="caption" color={token.textSecondary}>{subtitle}</Text>
    </View>
  );
}

function HomeScreen() {
  const token = useTokens();
  const toasts = useToasts();
  const [period, setPeriod] = useState("harian");
  const [search, setSearch] = useState("");
  const [notify, setNotify] = useState(true);
  const [filters, setFilters] = useState<string[]>(["km"]);
  const [note, setNote] = useState("");
  const [sheet, setSheet] = useState(false);
  const [dialog, setDialog] = useState(false);

  return (
    <Screen>
      <ScreenTitle title="S.T.A.R.S" subtitle="WMPL · HRIS & armada logistik" />

      <Row gap={8}>
        <Badge label="SUPER ADMIN" tone="info" dot />
        <Badge label="WMPL" tone="success" dot />
        <Badge label="Cutoff 26–25" />
      </Row>

      <Row gap={10} align="flex-start">
        <MetricCard label="Total KM" value="13.860" hint="Target 18.000 KM" />
        <MetricCard label="Capaian" value="77%" hint="Target hari ini 74%" tone="warning" />
      </Row>

      <Card
        title="Performa unit"
        description="Capaian = total KM supir / target KM unit"
        meta="Matriks operasional"
        status="Hari ke-22"
      >
        <DataTable
          rows={matrix}
          keyOf={(row) => row.unit}
          minWidth={420}
          columns={[
            { key: "unit", header: "Unit", width: 130, render: (row) => <Text weight="600">{row.unit}</Text> },
            { key: "driver", header: "Supir", width: 130 },
            { key: "km", header: "KM", width: 80, align: "right" },
            { key: "trips", header: "Trip", width: 60, align: "right" },
            {
              key: "tone",
              header: "Status",
              width: 90,
              render: (row) => <Badge label={row.tone === "green" ? "aman" : "waspada"} tone={row.tone === "green" ? "success" : "warning"} />,
            },
          ]}
        />
      </Card>

      <Card title="KM hari ini" description="Empat belas hari terakhir" meta="Realtime">
        <BarChart
          data={[
            { label: "S", value: 4 },
            { label: "S", value: 6 },
            { label: "R", value: 5 },
            { label: "K", value: 8 },
            { label: "J", value: 7 },
            { label: "S", value: 3 },
          ]}
        />
        <Gauge value={77} label="dari target unit" />
        <Progress value={77} label="Realisasi bulanan" tone="warning" />
      </Card>

      <Card title="Ringkasan wilayah" description="Capaian terhadap target wilayah" meta="Wilayah Riau">
        <Row gap={16}>
          <DonutChart value={82} label="Riau" />
          <Stack gap={8} style={{ flex: 1 }}>
            <Stat label="DO diminta" value="4 unit" hint="2 route aktif" />
            <Stat label="Unit bekerja" value="2 unit" hint="rasio 0,50" tone="warning" />
          </Stack>
        </Row>
      </Card>

      <SectionTitle title="Komponen Arc" />

      <Card title="Button · semua varian" description="primary, secondary, ghost, danger, outline, loading">
        <Row gap={8} style={{ flexWrap: "wrap" }}>
          <Button label="Primary" size="sm" onPress={() => toasts.push("Tersimpan", "success")} />
          <Button label="Secondary" size="sm" variant="secondary" />
          <Button label="Ghost" size="sm" variant="ghost" />
          <Button label="Hapus" size="sm" variant="danger" />
          <Button label="Outline" size="sm" variant="outline" />
          <Button label="Memuat" size="sm" loading />
        </Row>
        <Button label="Buka sheet" full onPress={() => setSheet(true)} />
        <Button label="Tutup cutoff" variant="outline" full onPress={() => setDialog(true)} />
      </Card>

      <Card title="Form absensi" description="Input harian Korlap">
        <Stack gap={12}>
          <SearchField label="Cari unit" value={search} onChange={setSearch} placeholder="BM 8842 RA…" />
          <Input label="Nomor DO" value="DO-202611-001" onChangeText={() => undefined} />
          <SegmentedControl
            options={[
              { id: "harian", label: "Harian" },
              { id: "bulanan", label: "Bulanan" },
            ]}
            value={period}
            onChange={setPeriod}
          />
          <ChipGroup
            multiple
            options={[
              { id: "km", label: "KM" },
              { id: "nup", label: "NUP" },
              { id: "st", label: "S.T" },
              { id: "part", label: "PART" },
            ]}
            value={filters}
            onChange={setFilters}
          />
          <Textarea
            label="Informasi"
            value={note}
            onChangeText={setNote}
            placeholder="Wajib untuk NUP, NUPL, REJECT, INSIDEN, B.M, A.M"
          />
          <Switch label="Notifikasi push" value={notify} onValueChange={setNotify} />
        </Stack>
      </Card>

      <Card title="Status warna" description="Legenda matriks sesuai PRD">
        <Row gap={8} style={{ flexWrap: "wrap" }}>
          <Badge label="S.T" tone="info" />
          <Badge label="NUP" tone="info" />
          <Badge label="PART" />
          <Badge label="REJECT" tone="danger" />
          <Badge label="B.M" tone="warning" />
          <Badge label="KM" tone="success" />
        </Row>
      </Card>

      <Text role="caption" color={token.textMuted}>
        {period} · {filters.length} filter aktif · {search ? `cari "${search}"` : "tanpa filter"}
      </Text>

      <BottomSheet visible={sheet} title="Update status harian" onClose={() => setSheet(false)}>
        <Text>Pilih kode status untuk unit BM 8842 RA.</Text>
        <Button label="Simpan status" onPress={() => setSheet(false)} />
      </BottomSheet>

      <Dialog
        visible={dialog}
        title="Tutup cutoff November?"
        description="Rekap 26 Okt – 25 Nov akan dikunci dan tidak bisa diubah."
        onClose={() => setDialog(false)}
        footer={<Button label="Tutup cutoff" variant="danger" size="sm" onPress={() => setDialog(false)} />}
      />

      <ToastStack messages={toasts.messages} onDismiss={toasts.dismiss} />
    </Screen>
  );
}

type Tab = "home" | "wmpl";

function AppShell() {
  const token = useTokens();
  const [tab, setTab] = useState<Tab>("home");

  return (
    <View style={{ flex: 1, backgroundColor: token.background }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 10,
          borderBottomWidth: 1,
          borderColor: token.border,
        }}
      >
        <Chip label="Beranda" selected={tab === "home"} onPress={() => setTab("home")} />
        <Chip label="WMPL" selected={tab === "wmpl"} onPress={() => setTab("wmpl")} />
        <View style={{ flex: 1 }} />
        <Badge label="S.T.A.R.S" tone="info" />
      </View>

      {tab === "home" ? <HomeScreen /> : <WmplScreen />}
    </View>
  );
}

export default function App() {
  return (
    <ArcProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar style="auto" />
        <AppShell />
      </SafeAreaView>
    </ArcProvider>
  );
}