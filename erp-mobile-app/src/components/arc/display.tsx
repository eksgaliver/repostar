import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { ActivityIndicator, Animated, Image, Pressable, StyleSheet, View } from "react-native";
import { Text } from "./foundation";
import { radius, toneColor, useTokens } from "./theme";
import type { Tone } from "./theme";

/* -------------------------------------------------------------------- badge */

export function Badge({
  label,
  tone = "neutral",
  dot = false,
  pill = true,
  outline = false,
}: {
  label: string;
  tone?: Tone;
  dot?: boolean;
  pill?: boolean;
  outline?: boolean;
}) {
  const token = useTokens();
  const color = toneColor(token, tone);
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: pill ? 999 : 8,
        borderWidth: outline ? StyleSheet.hairlineWidth : 0,
        borderColor: color,
        backgroundColor: outline ? "transparent" : `${color}22`,
      }}
    >
      {dot ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} /> : null}
      <Text role="caption" weight="600" color={color}>
        {label}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------- avatar */

export function Avatar({ name, size = 36, uri }: { name: string; size?: number; uri?: string }) {
  const token = useTokens();
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: token.surfaceMuted,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: token.border,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text role="caption" weight="600" color={token.textSecondary} style={{ fontSize: size * 0.34 }}>
        {initials}
      </Text>
    </View>
  );
}

export function AvatarGroup({ names, max = 4, size = 32 }: { names: string[]; max?: number; size?: number }) {
  const token = useTokens();
  const visible = names.slice(0, max);
  const rest = names.length - visible.length;
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {visible.map((name, index) => (
        <View
          key={`${name}-${index}`}
          style={{ marginLeft: index === 0 ? 0 : -size * 0.28, borderWidth: 2, borderColor: token.background, borderRadius: size }}
        >
          <Avatar name={name} size={size} />
        </View>
      ))}
      {rest > 0 ? (
        <View
          style={{
            marginLeft: -size * 0.28,
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: token.surfaceMuted,
            borderWidth: 2,
            borderColor: token.background,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text role="caption" weight="600">+{rest}</Text>
        </View>
      ) : null}
    </View>
  );
}

/* ----------------------------------------------------------------- skeleton */

export function Skeleton({ lines = 3, avatar = false }: { lines?: number; avatar?: boolean }) {
  const token = useTokens();
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      {avatar ? <Animated.View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: token.surfaceMuted, opacity: pulse }} /> : null}
      <View style={{ flex: 1, gap: 8 }}>
        {Array.from({ length: lines }).map((_, index) => (
          <Animated.View
            key={index}
            style={{
              height: 12,
              width: index === lines - 1 ? "60%" : "100%",
              borderRadius: 6,
              backgroundColor: token.surfaceMuted,
              opacity: pulse,
            }}
          />
        ))}
      </View>
    </View>
  );
}

/* ----------------------------------------------------------------- progress */

export function Progress({
  value,
  tone = "info",
  label,
  height = 6,
}: {
  value: number;
  tone?: Tone;
  label?: string;
  height?: number;
}) {
  const token = useTokens();
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text role="caption">{label}</Text>
          <Text role="caption" weight="600">{Math.round(clamped)}%</Text>
        </View>
      ) : null}
      <View style={{ height, borderRadius: height / 2, backgroundColor: token.surfaceMuted, overflow: "hidden" }}>
        <View
          style={{
            width: `${clamped}%`,
            height: "100%",
            borderRadius: height / 2,
            backgroundColor: toneColor(token, tone),
          }}
        />
      </View>
    </View>
  );
}

export function Gauge({ value, label }: { value: number; label?: string }) {
  const token = useTokens();
  const tone: Tone = value >= 100 ? "success" : value >= 80 ? "warning" : "danger";
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
        <Text role="title" weight="700">{Math.round(value)}%</Text>
        {label ? <Text role="caption">{label}</Text> : null}
      </View>
      <View style={{ height: 10, borderRadius: 5, backgroundColor: token.surfaceMuted, overflow: "hidden" }}>
        <View
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
            height: "100%",
            backgroundColor: toneColor(token, tone),
          }}
        />
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------- rating */

export function Rating({
  value = 0,
  onChange,
  max = 5,
  label,
}: {
  value?: number;
  onChange?: (next: number) => void;
  max?: number;
  label?: string;
}) {
  const token = useTokens();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      {label ? <Text role="caption">{label}</Text> : null}
      {Array.from({ length: max }).map((_, index) => {
        const filled = index < value;
        const content = (
          <Text color={filled ? token.warning : token.borderStrong} style={{ fontSize: 18 }}>
            ★
          </Text>
        );
        return onChange ? (
          <Pressable key={index} accessibilityRole="button" accessibilityLabel={`Beri ${index + 1} bintang`} onPress={() => onChange(index + 1)}>
            {content}
          </Pressable>
        ) : (
          <View key={index}>{content}</View>
        );
      })}
    </View>
  );
}

/* --------------------------------------------------------------- stat cards */

export function Stat({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: Tone;
}) {
  const token = useTokens();
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <Text role="caption" weight="600">{label}</Text>
      <Text role="title" weight="700" color={tone === "neutral" ? token.foreground : toneColor(token, tone)}>
        {value}
      </Text>
      {hint ? <Text role="caption">{hint}</Text> : null}
    </View>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: Tone;
}) {
  const token = useTokens();
  return (
    <View
      style={{
        flex: 1,
        minWidth: 140,
        gap: 6,
        padding: 14,
        borderRadius: radius(token, "radiusControl"),
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: token.border,
        backgroundColor: token.surface,
      }}
    >
      <Text role="caption" weight="600">{label}</Text>
      <Text role="title" weight="700" color={tone === "neutral" ? token.foreground : toneColor(token, tone)}>
        {value}
      </Text>
      {hint ? <Text role="caption" numberOfLines={2}>{hint}</Text> : null}
    </View>
  );
}

export function Card({
  title,
  description,
  meta,
  status,
  action,
  children,
}: {
  title: string;
  description?: string;
  meta?: string;
  status?: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  const token = useTokens();
  return (
    <View
      style={{
        gap: 8,
        padding: 16,
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: token.border,
        backgroundColor: token.surface,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text role="heading" weight="600">{title}</Text>
          {description ? <Text role="caption">{description}</Text> : null}
        </View>
        {action}
      </View>
      {meta || status ? (
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {meta ? <Text role="caption" weight="600">{meta}</Text> : <View />}
          {status ? <Text role="caption">{status}</Text> : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  const token = useTokens();
  return (
    <View
      style={{
        alignItems: "center",
        gap: 8,
        padding: 28,
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: token.border,
        borderStyle: "dashed",
        backgroundColor: token.surfaceMuted,
      }}
    >
      <Text role="heading" weight="600">{title}</Text>
      {description ? <Text role="caption" align="center">{description}</Text> : null}
      {action}
    </View>
  );
}

export function Spinner({ label }: { label?: string }) {
  const token = useTokens();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <ActivityIndicator color={token.accent} />
      {label ? <Text role="caption">{label}</Text> : null}
    </View>
  );
}

export function DividerLabel({ label }: { label: string }) {
  const token = useTokens();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: token.border }} />
      <Text role="caption" weight="600">{label}</Text>
      <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: token.border }} />
    </View>
  );
}