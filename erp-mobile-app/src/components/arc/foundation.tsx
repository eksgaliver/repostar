import { Children, isValidElement } from "react";
import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text as RNText, View } from "react-native";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { useTokens } from "./theme";

/* --------------------------------------------------------------------- text */

type TextRole = "display" | "title" | "heading" | "body" | "label" | "caption" | "mono";

const roleSize: Record<TextRole, number> = {
  display: 32,
  title: 24,
  heading: 18,
  body: 15,
  label: 13,
  caption: 12,
  mono: 13,
};

export interface TextProps {
  children?: ReactNode;
  role?: TextRole;
  color?: string;
  align?: "left" | "center" | "right";
  weight?: "400" | "500" | "600" | "700";
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
}

export function Text({ children, role = "body", color, align = "left", weight, numberOfLines, style }: TextProps) {
  const token = useTokens();
  return (
    <RNText
      numberOfLines={numberOfLines}
      style={[
        {
          fontSize: roleSize[role],
          lineHeight: roleSize[role] * 1.45,
          color: color ?? (role === "caption" ? token.textMuted : token.foreground),
          textAlign: align,
          fontWeight: weight ?? (role === "display" || role === "title" || role === "heading" ? "600" : "400"),
          fontFamily: role === "mono" ? "monospace" : undefined,
        },
        role === "label" ? { letterSpacing: 0.2, color: color ?? token.textSecondary } : null,
        role === "caption" ? { letterSpacing: 0.2 } : null,
        style as never,
      ]}
    >
      {children}
    </RNText>
  );
}

export function Heading({ children, level = 2 }: { children: ReactNode; level?: 1 | 2 | 3 }) {
  const role: TextRole = level === 1 ? "display" : level === 2 ? "title" : "heading";
  return <Text role={role}>{children}</Text>;
}

export function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  const token = useTokens();
  return (
    <View style={{ gap: 2, paddingTop: 8 }}>
      <Text role="heading" weight="600">{title}</Text>
      {hint ? <Text role="caption" color={token.textMuted}>{hint}</Text> : null}
    </View>
  );
}

/* ------------------------------------------------------------------- layout */

export interface StackProps {
  children?: ReactNode;
  gap?: number;
  padding?: number;
  align?: "stretch" | "flex-start" | "center" | "flex-end";
  style?: StyleProp<ViewStyle>;
}

export function Stack({ children, gap = 12, padding = 0, align = "stretch", style }: StackProps) {
  return <View style={[{ gap, padding, alignItems: align }, style]}>{children}</View>;
}

export function Row({ children, gap = 8, padding = 0, align = "center", style }: StackProps) {
  return (
    <View style={[{ flexDirection: "row", gap, padding, alignItems: align }, style]}>{children}</View>
  );
}

export function Spacer({ size = 12 }: { size?: number }) {
  return <View style={{ height: size }} />;
}

export function Divider({ inset = 0 }: { inset?: number }) {
  const token = useTokens();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: token.border, marginHorizontal: inset }} />;
}

export interface SurfaceProps {
  children?: ReactNode;
  tone?: "default" | "muted" | "raised";
  padding?: number;
  style?: StyleProp<ViewStyle>;
}

export function Surface({ children, tone = "default", padding = 16, style }: SurfaceProps) {
  const token = useTokens();
  const background = tone === "muted" ? token.surfaceMuted : tone === "raised" ? token.surfaceRaised : token.surface;
  return (
    <View
      style={[
        {
          backgroundColor: background,
          borderRadius: 16,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: token.border,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Screen({
  children,
  padding = 20,
  gap = 16,
  scroll = true,
}: {
  children?: ReactNode;
  padding?: number;
  gap?: number;
  scroll?: boolean;
}) {
  const token = useTokens();
  const body = <View style={{ gap, padding }}>{children}</View>;
  if (!scroll) return <View style={{ flex: 1, backgroundColor: token.background }}>{body}</View>;
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: token.background }}
      contentContainerStyle={{ paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      {body}
    </ScrollView>
  );
}

/** `Stack` that only renders its children when there is more than one. */
export function MaybeStack({ children, gap }: { children: ReactNode; gap?: number }) {
  const many = Children.toArray(children).filter(isValidElement).length > 1;
  return many ? <Stack gap={gap}>{children}</Stack> : <>{children}</>;
}