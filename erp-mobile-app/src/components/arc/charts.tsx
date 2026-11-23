import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "./foundation";
import { toneColor, useTokens } from "./theme";
import type { Tone } from "./theme";

export interface BarDatum {
  label: string;
  value: number;
  tone?: Tone;
}

/** Column chart with a baseline and hover-free labels, sized by the tallest bar. */
export function BarChart({ data, height = 140 }: { data: BarDatum[]; height?: number }) {
  const token = useTokens();
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((entry) => entry.value));

  return (
    <View style={{ gap: 8 }}>
      <View style={{ height, flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
        {data.map((entry, index) => {
          const ratio = entry.value / max;
          return (
            <Pressable
              key={`${entry.label}-${index}`}
              accessibilityLabel={`${entry.label}: ${entry.value}`}
              onPress={() => setActive(active === index ? null : index)}
              style={{ flex: 1, alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}
            >
              {active === index ? (
                <Text role="caption" weight="600">{entry.value}</Text>
              ) : null}
              <View
                style={{
                  width: "100%",
                  borderRadius: 6,
                  height: `${Math.max(4, ratio * 100)}%`,
                  backgroundColor: toneColor(token, entry.tone ?? "info"),
                  opacity: active === null || active === index ? 1 : 0.5,
                }}
              />
            </Pressable>
          );
        })}
      </View>
      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: token.border }} />
      <View style={{ flexDirection: "row", gap: 8 }}>
        {data.map((entry, index) => (
          <Text key={`label-${index}`} role="caption" align="center" style={{ flex: 1 }} numberOfLines={1}>
            {entry.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function StackedBarChart({
  series,
  height = 14,
}: {
  series: { label: string; value: number; tone?: Tone }[];
  height?: number;
}) {
  const token = useTokens();
  const total = series.reduce((sum, entry) => sum + entry.value, 0) || 1;
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", height, borderRadius: height / 2, overflow: "hidden" }}>
        {series.map((entry) => (
          <View
            key={entry.label}
            style={{ width: `${(entry.value / total) * 100}%`, backgroundColor: toneColor(token, entry.tone ?? "info") }}
          />
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {series.map((entry) => (
          <View key={entry.label} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View
              style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: toneColor(token, entry.tone ?? "info") }}
            />
            <Text role="caption">
              {entry.label} · {entry.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Sparkline drawn as thin columns, so it stays crisp without SVG. */
export function Sparkline({ points, height = 36, tone = "info" }: { points: number[]; height?: number; tone?: Tone }) {
  const token = useTokens();
  const max = Math.max(1, ...points);
  const color = toneColor(token, tone);
  return (
    <View style={{ height, flexDirection: "row", alignItems: "flex-end", gap: 2 }}>
      {points.map((point, index) => (
        <View
          key={index}
          style={{
            flex: 1,
            height: `${Math.max(6, (point / max) * 100)}%`,
            borderRadius: 2,
            backgroundColor: color,
            opacity: 0.35 + (point / max) * 0.65,
          }}
        />
      ))}
    </View>
  );
}

export const LineChart = Sparkline;

/** 12-segment ring: a donut that needs no native SVG dependency. */
export function DonutChart({
  value,
  size = 120,
  thickness = 12,
  tone = "info",
  label,
}: {
  value: number;
  size?: number;
  thickness?: number;
  tone?: Tone;
  label?: string;
}) {
  const token = useTokens();
  const segments = 12;
  const filled = Math.round((Math.min(100, Math.max(0, value)) / 100) * segments);

  return (
    <View style={{ alignItems: "center", justifyContent: "center", width: size, height: size }}>
      {Array.from({ length: segments }).map((_, index) => {
        const active = index < filled;
        return (
          <View
            key={index}
            style={{
              position: "absolute",
              width: thickness,
              height: size / 2,
              top: 0,
              left: size / 2 - thickness / 2,
              transformOrigin: `center ${size / 2}px`,
              transform: [{ rotate: `${(index * 360) / segments}deg` }],
              backgroundColor: active ? toneColor(token, tone) : token.surfaceMuted,
              borderRadius: thickness / 2,
            }}
          />
        );
      })}
      <View
        style={{
          width: size - thickness * 2.6,
          height: size - thickness * 2.6,
          borderRadius: (size - thickness * 2.6) / 2,
          backgroundColor: token.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text weight="700" role="heading">{Math.round(value)}%</Text>
        {label ? <Text role="caption">{label}</Text> : null}
      </View>
    </View>
  );
}

export function WaffleChart({
  value,
  total = 100,
  columns = 10,
  tone = "info",
}: {
  value: number;
  total?: number;
  columns?: number;
  tone?: Tone;
}) {
  const token = useTokens();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 3, maxWidth: columns * 15 }}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={{
            width: 12,
            height: 12,
            borderRadius: 3,
            backgroundColor: index < value ? toneColor(token, tone) : token.surfaceMuted,
          }}
        />
      ))}
    </View>
  );
}

export function ProgressRing({ value, size = 96 }: { value: number; size?: number }) {
  const tone: Tone = value >= 100 ? "success" : value >= 80 ? "warning" : "danger";
  return <DonutChart value={value} size={size} thickness={10} tone={tone} label="capaian" />;
}

export function Treemap({ data }: { data: BarDatum[] }) {
  const token = useTokens();
  const total = data.reduce((sum, entry) => sum + entry.value, 0) || 1;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
      {data.map((entry) => (
        <View
          key={entry.label}
          style={{
            width: `${Math.max(18, (entry.value / total) * 100)}%`,
            minHeight: 48,
            padding: 8,
            borderRadius: 8,
            backgroundColor: toneColor(token, entry.tone ?? "info"),
            opacity: 0.85,
            justifyContent: "flex-end",
          }}
        >
          <Text role="caption" weight="600" color="#ffffff" numberOfLines={1}>
            {entry.label}
          </Text>
          <Text role="caption" color="#ffffff">{entry.value}</Text>
        </View>
      ))}
    </View>
  );
}

export function Heatmap({
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
    <View style={{ gap: 3 }}>
      {rows.map((row, rowIndex) => (
        <View key={row} style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
          <Text role="caption" style={{ width: 44 }} numberOfLines={1}>{row}</Text>
          {columns.map((column, columnIndex) => {
            const value = values[rowIndex]?.[columnIndex] ?? 0;
            return (
              <View
                key={`${row}-${column}`}
                accessibilityLabel={`${row} ${column}: ${value}`}
                style={{
                  flex: 1,
                  height: 16,
                  borderRadius: 4,
                  backgroundColor: color,
                  opacity: value === 0 ? 0.08 : 0.2 + (value / max) * 0.8,
                }}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

/** Ridge/stream charts collapse to stacked columns on a phone width. */
export const RidgeLine = BarChart;
export const StreamGraph = StackedBarChart;