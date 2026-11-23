# Arc UI → React Native — status port

Registry web berisi **128 komponen** (React DOM + CSS modules). Folder ini mem-port-nya ke
React Native memakai token yang sama (`tokens.ts`, hasil konversi oklch → hex dari
`foundation.css`).

Import selalu dari barrel:

```tsx
import { ArcProvider, Button, DataTable } from "@/components/arc";
```

## Sudah diport (±80 dari 128 komponen registry, 95+ export)

| Modul | Export | Komponen registry yang dipetakan |
| --- | --- | --- |
| `theme.tsx` | `ArcProvider`, `useArcTheme`, `useTokens`, `toneColor`, `rem` | arc-foundation |
| `foundation.tsx` | `Text`, `Heading`, `SectionTitle`, `Stack`, `Row`, `Spacer`, `Divider`, `Surface`, `Screen` | tipografi & layout dasar |
| `controls.tsx` | `Button`, `IconButton`, `Chip`, `ChipGroup`, `Switch`, `Checkbox`, `RadioGroup`, `SegmentedControl`, `ToggleGroup`, `HoldToConfirm`, `Stepper` | `button`, `chip-group`, `switch`, `checkbox`, `radio-group`, `segmented-control`, `toggle-group`, `hold-to-confirm`, `stepper`, `action-button` (lewat loading) |
| `display.tsx` | `Badge`, `Avatar`, `AvatarGroup`, `Skeleton`, `Progress`, `Gauge`, `Rating`, `Stat`, `MetricCard`, `Card`, `EmptyState`, `Spinner`, `DividerLabel` | `badge`, `avatar`, `avatar-group`, `skeleton`, `progress`, `gauge`, `rating`, `metric-card`, `card`, `empty-state` |
| `inputs.tsx` | `Field`, `Input`, `Textarea`, `SearchField`, `PasswordField`, `NumberField`, `MoneyInput`, `TagInput`, `Select`, `MultiSelect`, `InlineEdit` | `input`, `textarea`, `search-field`, `password-field`, `number-field`, `money-input`, `tag-input`, `select`, `multi-select`, `inline-edit` |
| `overlays.tsx` | `BottomSheet`, `Dialog`, `Menu`, `DropdownMenu`, `ToastStack`, `useToasts`, `ConfirmDialog` | `bottom-sheet`, `dialog`, `dropdown-menu`, `context-menu` (lewat `Menu`), `toast`, `toast-stack`, `confirm-morph` (versi dialog) |
| `data.tsx` | `Tabs`, `Accordion`, `Breadcrumb`, `Timeline`, `TreeView`, `DataTable`, `SortableDataTable`, `Pagination`, `ActivityHeatmap`, `ReorderableList` | `tabs`, `accordion`, `breadcrumb`, `timeline`, `tree-view`, `sortable-data-table`, `pagination`, `activity-heatmap`, `reorderable-list` |
| `charts.tsx` | `BarChart`, `StackedBarChart`, `Sparkline`, `LineChart`, `DonutChart`, `WaffleChart`, `ProgressRing`, `Treemap`, `Heatmap`, `RidgeLine`, `StreamGraph` | `bar-chart`, `sparkline`, `line-chart`, `donut-chart`, `waffle-chart`, `treemap`, `heatmap`, `ridgeline`, `streamgraph` |
| `extra.tsx` | `SplitButton`, `SwipeActionsRow`, `Tooltip`, `Popover`, `Countdown`, `Slider`, `ThemeSwitch`, `TextMorph`, `TextShimmer`, `SlotText`, `UsageMeter`, `CopyButton`, `Calendar`, `DatePicker`, `TimePicker`, `CodeBlock`, `JsonViewer`, `Carousel`, `ColorPicker` | `split-button`, `swipe-actions`, `tooltip`, `popover`, `countdown`, `slider`, `theme-switch`, `text-morph`, `text-shimmer`, `slot-text`, `usage-meter`, `copy-button`, `calendar`, `date-picker`, `date-range-picker`, `time-picker`, `code-block`, `json-viewer`, `carousel`, `color-picker` |
| `registry.tsx` | `arcPorts`, `arcCoverage`, `getArcPort`, `ArcNotPorted` | pemetaan seluruh 128 nama registry → port atau placeholder berlabel

## Belum diport

Sisa komponen yang butuh API browser, canvas, atau library gesture berat:

`billing-toggle`, `brush-chart`, `chat-thread`, `comment-thread`, `command-palette`,
`cookie-consent`, `elastic-slider`, `expandable-card`, `expandable-text`,
`expanding-search`, `file-dropzone`, `file-upload`, `filter-toolbar`, `hover-card`,
`image-compare`, `in-view-title`, `mention-input`, `onboarding-checklist`, `page-header`,
`password-strength`, `phone-input`, `range-histogram-slider`, `reactions`,
`resizable-panels`, `rich-text-editor`, `ruler-slider`, `scrub-input`,
`shortcut-recorder`, `signature-pad`, `text-reveal`, `toast`, `tree-table`, `user-menu`,
plus seluruh `blocks/*` (marketing).

`registry.tsx` tetap mengekspos **semua 128 nama**: yang belum diport mengembalikan
`ported: false` + alasan, dan `<ArcNotPorted name="…" />` menampilkan placeholder berlabel —
bukan komponen palsu. Cek cakupan terkini lewat `arcCoverage.ported`.

Gelombang berikutnya yang paling masuk akal: `expandable-card`/`expandable-text` (LayoutAnimation),
`filter-toolbar`, `page-header`, `toast` (→ ToastStack), `reactions` (→ ChipGroup),
`password-strength`, `phone-input`, `text-reveal`, lalu `chat-thread`/`comment-thread`.

> Folder ini adalah port manual, bukan file vendored. Aman diedit.