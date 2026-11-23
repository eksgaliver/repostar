import { useState } from "react";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "./foundation";
import { toneColor, useTokens } from "./theme";
import type { Tone } from "./theme";

/* -------------------------------------------------------------------- tabs */

export interface TabItem {
  id: string;
  label: string;
  badge?: string;
}

export function Tabs({
  items,
  value,
  onChange,
}: {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
}) {
  const token = useTokens();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
      {items.map((item) => {
        const active = item.id === value;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(item.id)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: 10,
              backgroundColor: active ? token.accent : token.surfaceMuted,
              flexDirection: "row",
              gap: 6,
              alignItems: "center",
            }}
          >
            <Text role="label" weight="600" color={active ? token.accentForeground : token.textSecondary}>
              {item.label}
            </Text>
            {item.badge ? (
              <Text role="caption" color={active ? token.accentForeground : token.textMuted}>
                {item.badge}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/* --------------------------------------------------------------- accordion */

export interface AccordionItem {
  id: string;
  title: string;
  subtitle?: string;
  content: ReactNode;
}

export function Accordion({ items, multiple = false }: { items: AccordionItem[]; multiple?: boolean }) {
  const token = useTokens();
  const [open, setOpen] = useState<string[]>([]);

  function toggle(id: string) {
    setOpen((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : multiple ? [...current, id] : [id],
    );
  }

  return (
    <View style={{ gap: 8 }}>
      {items.map((item) => {
        const active = open.includes(item.id);
        return (
          <View
            key={item.id}
            style={{ borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: token.border, overflow: "hidden" }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: active }}
              onPress={() => toggle(item.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 14,
                backgroundColor: token.surface,
                gap: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text weight="600">{item.title}</Text>
                {item.subtitle ? <Text role="caption">{item.subtitle}</Text> : null}
              </View>
              <Text role="caption">{active ? "▲" : "▼"}</Text>
            </Pressable>
            {active ? <View style={{ padding: 14, paddingTop: 0 }}>{item.content}</View> : null}
          </View>
        );
      })}
    </View>
  );
}

/* -------------------------------------------------------------- breadcrumb */

export function Breadcrumb({ items }: { items: { label: string; onPress?: () => void }[] }) {
  const token = useTokens();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
      {items.map((item, index) => (
        <View key={`${item.label}-${index}`} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Pressable disabled={!item.onPress} onPress={item.onPress} accessibilityRole="link">
            <Text
              role="caption"
              weight={index === items.length - 1 ? "600" : "400"}
              color={index === items.length - 1 ? token.foreground : token.textMuted}
            >
              {item.label}
            </Text>
          </Pressable>
          {index < items.length - 1 ? <Text role="caption">/</Text> : null}
        </View>
      ))}
    </View>
  );
}

/* ---------------------------------------------------------------- timeline */

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  time?: string;
  tone?: Tone;
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  const token = useTokens();
  return (
    <View style={{ gap: 0 }}>
      {items.map((item, index) => (
        <View key={item.id} style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ alignItems: "center", width: 14 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                marginTop: 6,
                backgroundColor: toneColor(token, item.tone ?? "info"),
              }}
            />
            {index < items.length - 1 ? (
              <View style={{ flex: 1, width: StyleSheet.hairlineWidth, backgroundColor: token.border, marginVertical: 2 }} />
            ) : null}
          </View>
          <View style={{ flex: 1, paddingBottom: 16, gap: 2 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
              <Text weight="600">{item.title}</Text>
              {item.time ? <Text role="caption">{item.time}</Text> : null}
            </View>
            {item.description ? <Text role="caption">{item.description}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

/* --------------------------------------------------------------- tree view */

export interface TreeNode {
  id: string;
  label: string;
  hint?: string;
  children?: TreeNode[];
}

export function TreeView({ nodes, depth = 0 }: { nodes: TreeNode[]; depth?: number }) {
  const token = useTokens();
  const [collapsed, setCollapsed] = useState<string[]>([]);

  return (
    <View style={{ gap: 4 }}>
      {nodes.map((node) => {
        const isCollapsed = collapsed.includes(node.id);
        return (
          <View key={node.id} style={{ gap: 4 }}>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                setCollapsed((current) =>
                  current.includes(node.id) ? current.filter((id) => id !== node.id) : [...current, node.id],
                )
              }
              style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: depth * 16, paddingVertical: 6 }}
            >
              <Text role="caption">{node.children?.length ? (isCollapsed ? "▸" : "▾") : "•"}</Text>
              <Text style={{ flex: 1 }} weight={node.children?.length ? "600" : "400"}>
                {node.label}
              </Text>
              {node.hint ? <Text role="caption">{node.hint}</Text> : null}
            </Pressable>
            {!isCollapsed && node.children?.length ? <TreeView nodes={node.children} depth={depth + 1} /> : null}
            {depth === 0 ? <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: token.borderSubtle }} /> : null}
          </View>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------- data tables */

export interface Column<Row> {
  key: string;
  header: string;
  width?: number;
  align?: "left" | "right";
  render?: (row: Row) => ReactNode;
  value?: (row: Row) => string | number;
}

export function DataTable<Row extends Record<string, unknown>>({
  columns,
  rows,
  keyOf,
  minWidth = 560,
  empty = "Belum ada data",
}: {
  columns: Column<Row>[];
  rows: Row[];
  keyOf: (row: Row) => string;
  minWidth?: number;
  empty?: string;
}) {
  const token = useTokens();
  if (!rows.length) {
    return <Text role="caption">{empty}</Text>;
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View style={{ minWidth }}>
        <View style={{ flexDirection: "row", backgroundColor: token.surfaceMuted, borderRadius: 10 }}>
          {columns.map((column) => (
            <View key={column.key} style={{ width: column.width ?? 120, padding: 10 }}>
              <Text role="caption" weight="600" align={column.align ?? "left"}>
                {column.header}
              </Text>
            </View>
          ))}
        </View>
        {rows.map((row) => (
          <View
            key={keyOf(row)}
            style={{
              flexDirection: "row",
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderColor: token.borderSubtle,
            }}
          >
            {columns.map((column) => (
              <View key={column.key} style={{ width: column.width ?? 120, padding: 10 }}>
                {column.render ? (
                  column.render(row)
                ) : (
                  <Text align={column.align ?? "left"} numberOfLines={2}>
                    {String(column.value ? column.value(row) : (row[column.key] ?? "—"))}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export function SortableDataTable<Row extends Record<string, unknown>>({
  columns,
  rows,
  keyOf,
}: {
  columns: Column<Row>[];
  rows: Row[];
  keyOf: (row: Row) => string;
}) {
  const token = useTokens();
  const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const sorted = [...rows].sort((a, b) => {
    if (!sort) return 0;
    const column = columns.find((entry) => entry.key === sort.key);
    const read = (row: Row) => (column?.value ? column.value(row) : (row[sort.key] as string | number));
    const left = read(a);
    const right = read(b);
    if (left === right) return 0;
    const result = left > right ? 1 : -1;
    return sort.direction === "asc" ? result : -result;
  });

  return (
    <View style={{ gap: 8 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {columns.map((column) => {
          const active = sort?.key === column.key;
          return (
            <Pressable
              key={column.key}
              accessibilityRole="button"
              onPress={() =>
                setSort((current) =>
                  current?.key === column.key
                    ? { key: column.key, direction: current.direction === "asc" ? "desc" : "asc" }
                    : { key: column.key, direction: "asc" },
                )
              }
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: active ? token.accent : token.border,
              }}
            >
              <Text role="caption" weight="600">
                {column.header} {active ? (sort?.direction === "asc" ? "↑" : "↓") : ""}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <DataTable columns={columns} rows={sorted} keyOf={keyOf} />
    </View>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const token = useTokens();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <Text role="caption">
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} dari {total}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Pressable
          accessibilityLabel="Halaman sebelumnya"
          disabled={page <= 1}
          onPress={() => onPageChange(page - 1)}
          style={{ paddingHorizontal: 10, paddingVertical: 6, opacity: page <= 1 ? 0.4 : 1 }}
        >
          <Text role="caption" weight="600">‹</Text>
        </Pressable>
        <Text role="caption" weight="600">
          {page} / {pages}
        </Text>
        <Pressable
          accessibilityLabel="Halaman berikutnya"
          disabled={page >= pages}
          onPress={() => onPageChange(page + 1)}
          style={{ paddingHorizontal: 10, paddingVertical: 6, opacity: page >= pages ? 0.4 : 1 }}
        >
          <Text role="caption" weight="600">›</Text>
        </Pressable>
      </View>
      <View style={{ width: 1, height: 1, backgroundColor: token.border }} />
    </View>
  );
}

/* ------------------------------------------------------------- heat matrix */

export function ActivityHeatmap({
  rows,
  columns,
  values,
  tone = "info",
}: {
  rows: string[];
  columns: string[];
  values: number[][];
  tone?: Tone;
}) {
  const token = useTokens();
  const max = Math.max(1, ...values.flat());
  const color = toneColor(token, tone);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View style={{ gap: 3 }}>
        <View style={{ flexDirection: "row", gap: 3, paddingLeft: 44 }}>
          {columns.map((column) => (
            <Text key={column} role="caption" style={{ width: 16 }}>{column}</Text>
          ))}
        </View>
        {rows.map((row, rowIndex) => (
          <View key={row} style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Text role="caption" style={{ width: 40 }} numberOfLines={1}>{row}</Text>
            {columns.map((column, columnIndex) => {
              const value = values[rowIndex]?.[columnIndex] ?? 0;
              const intensity = value === 0 ? 0.08 : 0.2 + (value / max) * 0.8;
              return (
                <View
                  key={`${row}-${column}`}
                  style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: color, opacity: intensity }}
                />
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

/* ------------------------------------------------------- reorderable list */

export function ReorderableList({
  items,
  onChange,
  renderItem,
}: {
  items: { id: string }[];
  onChange: (next: { id: string }[]) => void;
  renderItem: (item: { id: string }, index: number) => ReactNode;
}) {
  const token = useTokens();
  function move(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [entry] = next.splice(from, 1);
    if (!entry) return;
    next.splice(to, 0, entry);
    onChange(next);
  }

  return (
    <View style={{ gap: 8 }}>
      {items.map((item, index) => (
        <View
          key={item.id}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            padding: 12,
            borderRadius: 12,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: token.border,
            backgroundColor: token.surface,
          }}
        >
          <Text role="caption">≡</Text>
          <View style={{ flex: 1 }}>{renderItem(item, index)}</View>
          <Pressable accessibilityLabel="Naikkan" onPress={() => move(index, index - 1)}>
            <Text role="caption">↑</Text>
          </Pressable>
          <Pressable accessibilityLabel="Turunkan" onPress={() => move(index, index + 1)}>
            <Text role="caption">↓</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}