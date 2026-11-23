# S.T.A.R.S — Mobile (Expo SDK 58)

Aplikasi lapangan untuk HRIS & armada. Nama aplikasi **S.T.A.R.S**, package
`com.stars.raihanrivana`, scheme `stars`.

## Run

```bash
bun install
bun run start          # Expo Go / development build
bun run android        # butuh emulator atau device
bunx tsc --noEmit      # type check (bersih)
```

Plugin native yang aktif (`app.json`): `expo-notifications`, `expo-location`, `expo-sqlite`.
Perubahan plugin hanya berlaku setelah prebuild / development build baru.

## Struktur

```
App.tsx                     demo layar: KPI, tabel, chart, form absensi, sheet, dialog, toast
src/components/arc/         port Arc UI untuk React Native
  tokens.ts                 token hasil konversi oklch -> hex (light & dark)
  theme.tsx                 ArcProvider, useTokens, toneColor
  foundation.tsx            Text, Heading, Stack, Row, Surface, Screen, Divider
  controls.tsx              Button (semua varian), Chip, Switch, Checkbox, Radio, Segmented,
                            ToggleGroup, HoldToConfirm, Stepper, IconButton
  display.tsx               Badge, Avatar, AvatarGroup, Skeleton, Progress, Gauge, Rating,
                            Stat, MetricCard, Card, EmptyState, Spinner
  inputs.tsx                Field, Input, Textarea, SearchField, Password, Number, Money,
                            TagInput, Select, MultiSelect, InlineEdit
  overlays.tsx              BottomSheet, Dialog, Menu, DropdownMenu, ToastStack, ConfirmDialog
  data.tsx                  Tabs, Accordion, Breadcrumb, Timeline, TreeView, DataTable,
                            SortableDataTable, Pagination, ActivityHeatmap, ReorderableList
  charts.tsx                Bar, StackedBar, Sparkline/Line, Donut, Waffle, Treemap, Heatmap
  MANIFEST.md               peta komponen registry -> port RN + daftar yang belum diport
```

Import selalu dari barrel:

```tsx
import { ArcProvider, Button, DataTable } from "@/components/arc";
```

## Catatan teknis

- `theme.tsx` membaca token yang sama dengan web, jadi light/dark konsisten.
- Chart digambar dengan `View` (tanpa `react-native-svg`) agar tidak menambah dependency native.
- Expo Go cukup untuk UI; geofence presisi dan push token butuh development build.