import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Switch as RNSwitch,
  View,
} from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { Text } from "./foundation";
import { useTokens } from "./theme";

/* ------------------------------------------------------------------- button */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
}

const sizeMetric: Record<ButtonSize, { height: number; padding: number; font: number }> = {
  sm: { height: 32, padding: 12, font: 13 },
  md: { height: 40, padding: 16, font: 15 },
  lg: { height: 48, padding: 20, font: 16 },
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  full = false,
  style,
}: ButtonProps) {
  const token = useTokens();
  const scale = useRef(new Animated.Value(1)).current;
  const inert = disabled || loading;
  const metric = sizeMetric[size];

  const palette = {
    primary: { bg: token.accent, fg: token.accentForeground, border: token.accent },
    secondary: { bg: token.surfaceMuted, fg: token.foreground, border: token.border },
    ghost: { bg: "transparent", fg: token.textSecondary, border: "transparent" },
    danger: { bg: token.danger, fg: "#ffffff", border: token.danger },
    outline: { bg: "transparent", fg: token.foreground, border: token.borderStrong },
  }[variant];

  function press(to: number) {
    if (inert) return;
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 2 }).start();
  }

  return (
    <Animated.View style={[{ transform: [{ scale }] }, full ? { alignSelf: "stretch" } : null, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: inert, busy: loading }}
        disabled={inert}
        onPress={onPress}
        onPressIn={() => press(0.97)}
        onPressOut={() => press(1)}
        style={{
          height: metric.height,
          paddingHorizontal: metric.padding,
          borderRadius: 12,
          borderWidth: variant === "outline" || variant === "secondary" ? StyleSheet.hairlineWidth : 0,
          borderColor: palette.border,
          backgroundColor: palette.bg,
          opacity: inert ? 0.55 : 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {loading ? <ActivityIndicator size="small" color={palette.fg} /> : icon}
        <Text weight="600" color={palette.fg} style={{ fontSize: metric.font }}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  variant = "secondary",
  size = 40,
}: {
  icon: ReactNode;
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: number;
}) {
  const token = useTokens();
  const background =
    variant === "primary" ? token.accent : variant === "secondary" ? token.surfaceMuted : "transparent";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        backgroundColor: background,
      }}
    >
      {icon}
    </Pressable>
  );
}

/* -------------------------------------------------------------------- chips */

export function Chip({
  label,
  selected = false,
  onPress,
  disabled = false,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const token = useTokens();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: selected ? token.accent : token.border,
        backgroundColor: selected ? token.accent : "transparent",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Text role="label" color={selected ? token.accentForeground : token.textSecondary} weight="500">
        {label}
      </Text>
    </Pressable>
  );
}

export interface ChipOption {
  id: string;
  label: string;
}

export function ChipGroup({
  options,
  value,
  onChange,
  multiple = false,
}: {
  options: ChipOption[];
  value: string[];
  onChange: (next: string[]) => void;
  multiple?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map((option) => {
        const selected = value.includes(option.id);
        return (
          <Chip
            key={option.id}
            label={option.label}
            selected={selected}
            onPress={() =>
              onChange(
                selected ? value.filter((id) => id !== option.id) : multiple ? [...value, option.id] : [option.id],
              )
            }
          />
        );
      })}
    </View>
  );
}

/* ----------------------------------------------------------------- selection */

export function Switch({
  value,
  onValueChange,
  label,
  disabled = false,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  const token = useTokens();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      {label ? <Text>{label}</Text> : null}
      <RNSwitch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: token.controlTrack, true: token.accent }}
        thumbColor={token.controlThumb}
      />
    </View>
  );
}

export function Checkbox({
  checked,
  onToggle,
  label,
  disabled = false,
}: {
  checked: boolean;
  onToggle: (next: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  const token = useTokens();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onToggle(!checked)}
      style={{ flexDirection: "row", alignItems: "center", gap: 10, opacity: disabled ? 0.5 : 1 }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 6,
          borderWidth: checked ? 0 : StyleSheet.hairlineWidth,
          borderColor: token.borderStrong,
          backgroundColor: checked ? token.accent : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked ? <Text color={token.accentForeground} style={{ fontSize: 12 }}>✓</Text> : null}
      </View>
      {label ? <Text>{label}</Text> : null}
    </Pressable>
  );
}

export interface RadioOption {
  id: string;
  label: string;
  hint?: string;
}

export function RadioGroup({
  options,
  value,
  onChange,
}: {
  options: RadioOption[];
  value?: string;
  onChange: (id: string) => void;
}) {
  const token = useTokens();
  return (
    <View style={{ gap: 8 }}>
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.id)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              padding: 12,
              borderRadius: 12,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: selected ? token.accent : token.border,
              backgroundColor: selected ? token.accentSubtle : "transparent",
            }}
          >
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                borderWidth: selected ? 5 : StyleSheet.hairlineWidth,
                borderColor: selected ? token.accent : token.borderStrong,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text>{option.label}</Text>
              {option.hint ? <Text role="caption">{option.hint}</Text> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export interface SegmentOption {
  id: string;
  label: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: SegmentOption[];
  value?: string;
  onChange: (id: string) => void;
}) {
  const token = useTokens();
  return (
    <View
      style={{
        flexDirection: "row",
        padding: 3,
        borderRadius: 12,
        backgroundColor: token.surfaceMuted,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: token.border,
      }}
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.id)}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 9,
              alignItems: "center",
              backgroundColor: active ? token.surface : "transparent",
              borderWidth: active ? StyleSheet.hairlineWidth : 0,
              borderColor: token.border,
            }}
          >
            <Text role="label" weight={active ? "600" : "400"} color={active ? token.foreground : token.textMuted}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ToggleGroup({
  options,
  value,
  onChange,
}: {
  options: SegmentOption[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const token = useTokens();
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {options.map((option) => {
        const active = value.includes(option.id);
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(active ? value.filter((id) => id !== option.id) : [...value, option.id])}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 10,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: active ? token.accent : token.border,
              backgroundColor: active ? token.accentSubtle : "transparent",
            }}
          >
            <Text role="label" weight={active ? "600" : "400"}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Hold-to-confirm, the RN port of Arc's destructive control. */
export function HoldToConfirm({
  label,
  confirmedLabel = "Selesai",
  duration = 1200,
  onConfirm,
}: {
  label: string;
  confirmedLabel?: string;
  duration?: number;
  onConfirm: () => void;
}) {
  const token = useTokens();
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  function start() {
    if (done) return;
    const step = 60;
    timer.current = setInterval(() => {
      setProgress((current) => {
        const next = current + step / duration;
        if (next >= 1) {
          if (timer.current) clearInterval(timer.current);
          setDone(true);
          onConfirm();
          return 1;
        }
        return next;
      });
    }, step);
  }

  function stop() {
    if (timer.current) clearInterval(timer.current);
    if (!done) setProgress(0);
  }

  return (
    <Pressable
      onPressIn={start}
      onPressOut={stop}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        height: 44,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: token.danger,
        overflow: "hidden",
        justifyContent: "center",
        paddingHorizontal: 16,
      }}
    >
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: `${progress * 100}%`,
          backgroundColor: token.danger,
          opacity: 0.18,
        }}
      />
      <Text weight="600" color={done ? token.danger : token.foreground}>
        {done ? confirmedLabel : label}
      </Text>
    </Pressable>
  );
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}) {
  const token = useTokens();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <Pressable
        accessibilityLabel="Kurangi"
        onPress={() => onChange(Math.max(min, value - 1))}
        style={{ width: 32, height: 32, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: token.border, alignItems: "center", justifyContent: "center" }}
      >
        <Text>−</Text>
      </Pressable>
      <Text weight="600">{value}</Text>
      <Pressable
        accessibilityLabel="Tambah"
        onPress={() => onChange(Math.min(max, value + 1))}
        style={{ width: 32, height: 32, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: token.border, alignItems: "center", justifyContent: "center" }}
      >
        <Text>+</Text>
      </Pressable>
    </View>
  );
}