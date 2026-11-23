/**
 * Registry lookup for React Native.
 *
 * The web dashboard ships all 146 registry items. This module reads the same
 * generated JSON so a screen can ask "do we have a port for `split-button`?"
 * without hard-coding a 128-name list. Anything without a port returns
 * `ported: false` plus the reason, and `<ArcNotPorted />` renders an honest
 * placeholder instead of pretending to be the real component.
 */
import type { ComponentType } from "react";
import { View } from "react-native";
import catalog from "./registry.generated.json";
import { Text } from "./foundation";
import { useTokens } from "./theme";
import { Badge, Card, EmptyState, Gauge, MetricCard, Progress, Rating, Skeleton } from "./display";
import {
  Button,
  Checkbox,
  Chip,
  ChipGroup,
  HoldToConfirm,
  IconButton,
  RadioGroup,
  SegmentedControl,
  Stepper,
  Switch,
  ToggleGroup,
} from "./controls";
import { Input, InlineEdit, MoneyInput, MultiSelect, NumberField, PasswordField, SearchField, Select, TagInput, Textarea } from "./inputs";
import { BottomSheet, ConfirmDialog, Dialog, DropdownMenu, Menu } from "./overlays";
import {
  Accordion,
  ActivityHeatmap,
  Breadcrumb,
  DataTable,
  Pagination,
  ReorderableList,
  SortableDataTable,
  Tabs,
  Timeline,
  TreeView,
} from "./data";
import { BarChart, DonutChart, Heatmap, LineChart, Sparkline, StackedBarChart, StreamGraph, Treemap, WaffleChart } from "./charts";
import {
  Calendar,
  Carousel,
  CodeBlock,
  ColorPicker,
  CopyButton,
  Countdown,
  DatePicker,
  JsonViewer,
  Popover,
  Slider,
  SlotText,
  SplitButton,
  SwipeActionsRow,
  TextMorph,
  TextShimmer,
  ThemeSwitch,
  TimePicker,
  Tooltip,
  UsageMeter,
} from "./extra";

/** Props differ per component; the registry only needs a renderable handle. */
type Port = ComponentType<never>;

/** Registry name -> RN implementation. Several names share one generic port. */
const ports: Record<string, Port> = {
  accordion: Accordion as Port,
  "action-button": Button as Port,
  "action-swap": SegmentedControl as Port,
  "activity-heatmap": ActivityHeatmap as Port,
  alert: Card as Port,
  "animated-counter": MetricCard as Port,
  avatar: Badge as Port,
  "avatar-group": Badge as Port,
  badge: Badge as Port,
  "bar-chart": BarChart as Port,
  "bottom-sheet": BottomSheet as Port,
  breadcrumb: Breadcrumb as Port,
  button: Button as Port,
  "button-group": ChipGroup as Port,
  calendar: Calendar as Port,
  card: Card as Port,
  carousel: Carousel as Port,
  checkbox: Checkbox as Port,
  "chip-group": ChipGroup as Port,
  "code-block": CodeBlock as Port,
  "color-picker": ColorPicker as Port,
  "confirm-morph": ConfirmDialog as Port,
  "context-menu": Menu as Port,
  "copy-button": CopyButton as Port,
  countdown: Countdown as Port,
  "date-picker": DatePicker as Port,
  "date-range-picker": DatePicker as Port,
  dialog: Dialog as Port,
  "donut-chart": DonutChart as Port,
  "dropdown-menu": DropdownMenu as Port,
  "empty-state": EmptyState as Port,
  "expanding-button-group": ChipGroup as Port,
  "floating-button-group": ChipGroup as Port,
  gauge: Gauge as Port,
  heatmap: Heatmap as Port,
  "hold-to-confirm": HoldToConfirm as Port,
  "icon-morph": Badge as Port,
  "inline-edit": InlineEdit as Port,
  input: Input as Port,
  "json-viewer": JsonViewer as Port,
  "line-chart": LineChart as Port,
  "metric-card": MetricCard as Port,
  "money-input": MoneyInput as Port,
  "multi-select": MultiSelect as Port,
  "number-field": NumberField as Port,
  pagination: Pagination as Port,
  "password-field": PasswordField as Port,
  popover: Popover as Port,
  progress: Progress as Port,
  "radio-group": RadioGroup as Port,
  rating: Rating as Port,
  "reorderable-list": ReorderableList as Port,
  "search-field": SearchField as Port,
  "segmented-control": SegmentedControl as Port,
  select: Select as Port,
  skeleton: Skeleton as Port,
  slider: Slider as Port,
  "slot-text": SlotText as Port,
  "sortable-data-table": SortableDataTable as Port,
  sparkline: Sparkline as Port,
  "split-button": SplitButton as Port,
  "stacked-bar-chart": StackedBarChart as Port,
  stepper: Stepper as Port,
  streamgraph: StreamGraph as Port,
  "swipe-actions": SwipeActionsRow as Port,
  switch: Switch as Port,
  tabs: Tabs as Port,
  "tag-input": TagInput as Port,
  textarea: Textarea as Port,
  "text-morph": TextMorph as Port,
  "text-shimmer": TextShimmer as Port,
  "theme-switch": ThemeSwitch as Port,
  "time-picker": TimePicker as Port,
  timeline: Timeline as Port,
  "toast-stack": Card as Port,
  "toggle-group": ToggleGroup as Port,
  tooltip: Tooltip as Port,
  "tree-view": TreeView as Port,
  treemap: Treemap as Port,
  "usage-meter": UsageMeter as Port,
  "waffle-chart": WaffleChart as Port,
};

/** Why a registry component has no native port yet. */
const reasons: Record<string, string> = {
  "brush-chart": "butuh canvas + gesture selection",
  "command-palette": "butuh keyboard & fuzzy overlay",
  "cookie-consent": "tidak relevan di aplikasi native",
  "elastic-slider": "butuh gesture physics",
  "expanding-search": "butuh animasi lebar layout",
  "file-dropzone": "butuh drag-and-drop file",
  "file-upload": "butuh expo-document-picker (belum jadi dependency)",
  "hover-card": "hover tidak ada di perangkat sentuh",
  "image-compare": "butuh slider clip-path + gambar besar",
  "mention-input": "butuh composer kaya teks",
  "range-histogram-slider": "butuh canvas histogram",
  "resizable-panels": "tablet-only, butuh drag handle",
  "rich-text-editor": "butuh WebView editor",
  "ruler-slider": "butuh gesture bertingkat",
  "scrub-input": "butuh pointer scrub",
  "shortcut-recorder": "tidak relevan tanpa keyboard fisik",
  "signature-pad": "butuh canvas / svg path",
  "tree-table": "menunggu virtualisasi tabel",
  "user-menu": "menunggu auth + sesi karyawan",
};

export interface ArcPortEntry {
  name: string;
  kind: string;
  categories: string[];
  ported: boolean;
  reason?: string;
  Component?: Port;
}

interface RawItem {
  name: string;
  type: string;
  categories?: string[];
}

const items = (catalog as { items: RawItem[] }).items.filter((item) => item.type === "registry:ui");

export const arcPorts: ArcPortEntry[] = items.map((item) => ({
  name: item.name,
  kind: item.type.replace("registry:", ""),
  categories: item.categories ?? [],
  ported: Boolean(ports[item.name]),
  reason: ports[item.name] ? undefined : (reasons[item.name] ?? "belum diport ke React Native"),
  Component: ports[item.name],
}));

export const arcCoverage = {
  total: items.length,
  ported: arcPorts.filter((entry) => entry.ported).length,
  pending: arcPorts.filter((entry) => !entry.ported).length,
};

export function getArcPort(name: string): ArcPortEntry | undefined {
  return arcPorts.find((entry) => entry.name === name);
}

/** Honest placeholder for registry items that have no native port yet. */
export function ArcNotPorted({ name }: { name: string }) {
  const token = useTokens();
  const entry = getArcPort(name);
  return (
    <View
      style={{
        gap: 4,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: token.border,
      }}
    >
      <Text role="label" weight="600">{name}</Text>
      <Text role="caption">{entry?.reason ?? "belum diport ke React Native"}</Text>
    </View>
  );
}