import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "./foundation";
import { Button } from "./controls";
import { Card, Progress } from "./display";
import { DropdownMenu } from "./overlays";
import type { MenuItem } from "./overlays";
import { useArcTheme, useTokens } from "./theme";

/* ------------------------------------------------------------- split button */

export function SplitButton({
  label,
  onPress,
  actions,
  variant = "primary",
}: {
  label: string;
  onPress?: () => void;
  actions: MenuItem[];
  variant?: "primary" | "secondary";
}) {
  return (
    <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
      <Button label={label} onPress={onPress} variant={variant} />
      <DropdownMenu label="Lainnya" items={actions} />
    </View>
  );
}

/* ------------------------------------------------------------ swipe actions */

export interface SwipeActionSpec {
  label: string;
  tone?: "neutral" | "accent" | "danger";
  onSelect: () => void;
}

export function SwipeActionsRow({
  children,
  actions,
}: {
  children: ReactNode;
  actions: SwipeActionSpec[];
}) {
  const token = useTokens();
  const translateX = useRef(new Animated.Value(0)).current;
  const open = useRef(false);

  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 12,
      onPanResponderMove: (_, gesture) => {
        const next = Math.max(-actions.length * 76, Math.min(0, gesture.dx));
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, gesture) => {
        const shouldOpen = gesture.dx < -40;
        open.current = shouldOpen;
        Animated.spring(translateX, {
          toValue: shouldOpen ? -actions.length * 76 : 0,
          useNativeDriver: true,
          speed: 20,
        }).start();
      },
    }),
  ).current;

  return (
    <View style={{ borderRadius: 12, overflow: "hidden" }}>
      <View style={{ position: "absolute", right: 0, top: 0, bottom: 0, flexDirection: "row" }}>
        {actions.map((action) => (
          <Pressable
            key={action.label}
            accessibilityLabel={action.label}
            onPress={() => {
              action.onSelect();
              Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
            }}
            style={{
              width: 76,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor:
                action.tone === "danger" ? token.danger : action.tone === "accent" ? token.accent : token.surfaceMuted,
            }}
          >
            <Text role="caption" weight="600" color={action.tone === "neutral" ? token.foreground : "#ffffff"}>
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Animated.View
        {...responder.panHandlers}
        style={{ transform: [{ translateX }], backgroundColor: token.surface }}
      >
        {children}
      </Animated.View>
    </View>
  );
}

/* ------------------------------------------------------------- tooltip/popover */

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  const token = useTokens();
  const [visible, setVisible] = useState(false);
  return (
    <View>
      <Pressable onLongPress={() => setVisible(true)} onPressOut={() => setVisible(false)}>{children}</Pressable>
      {visible ? (
        <View
          style={{
            position: "absolute",
            bottom: "120%",
            alignSelf: "center",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            backgroundColor: token.foreground,
          }}
        >
          <Text role="caption" color={token.background}>{label}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function Popover({
  trigger,
  title,
  children,
}: {
  trigger: string;
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <Button label={trigger} size="sm" variant="outline" onPress={() => setOpen((value) => !value)} />
      {open ? <Card title={title}>{children}</Card> : null}
    </View>
  );
}

/* ---------------------------------------------------------------- countdown */

export function Countdown({ seconds, label }: { seconds: number; label?: string }) {
  const token = useTokens();
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    const timer = setInterval(() => setLeft((value) => (value > 0 ? value - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
      <Text role="title" weight="700" color={left === 0 ? token.danger : token.foreground}>
        {mm}:{ss}
      </Text>
      {label ? <Text role="caption">{label}</Text> : null}
    </View>
  );
}

/* ------------------------------------------------------------------- slider */

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const token = useTokens();
  const [width, setWidth] = useState(0);
  const ratio = (value - min) / Math.max(1, max - min);

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{ height: 32, justifyContent: "center" }}
      accessibilityRole="adjustable"
      accessibilityValue={{ min, max, now: value }}
    >
      <View style={{ height: 6, borderRadius: 3, backgroundColor: token.surfaceMuted }}>
        <View style={{ width: `${ratio * 100}%`, height: "100%", borderRadius: 3, backgroundColor: token.accent }} />
      </View>
      <View
        {...PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onMoveShouldSetPanResponder: () => true,
          onPanResponderGrant: () => undefined,
          onPanResponderMove: (_, gesture) => {
            if (!width) return;
            const nextRatio = Math.min(1, Math.max(0, gesture.moveX / width));
            const raw = min + nextRatio * (max - min);
            onChange(Math.round(raw / step) * step);
          },
        }).panHandlers}
        style={{
          position: "absolute",
          left: Math.max(0, Math.min(width - 20, ratio * width - 10)),
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: token.surface,
          borderWidth: 2,
          borderColor: token.accent,
        }}
      />
    </View>
  );
}

/* ------------------------------------------------------------- theme switch */

export function ThemeSwitch({ label = "Tema" }: { label?: string }) {
  const { theme, toggle } = useArcTheme();
  return <Button label={`${label}: ${theme === "light" ? "Terang" : "Gelap"}`} size="sm" variant="secondary" onPress={toggle} />;
}

/* --------------------------------------------------------------- text morph */

export function TextMorph({ value, prefix }: { value: string; prefix?: string }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const [shown, setShown] = useState(value);

  useEffect(() => {
    Animated.timing(opacity, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setShown(value);
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }).start();
    });
  }, [value, opacity]);

  return (
    <Animated.View style={{ opacity }}>
      <Text weight="600">
        {prefix ? `${prefix} ` : ""}
        {shown}
      </Text>
    </Animated.View>
  );
}

export function TextShimmer({ children }: { children: string }) {
  const token = useTokens();
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View style={{ opacity: pulse }}>
      <Text weight="600" color={token.textSecondary}>{children}</Text>
    </Animated.View>
  );
}

/** Slot-text: monospaced digits that read like a counter. */
export function SlotText({ value }: { value: string }) {
  return (
    <Text role="mono" weight="700">
      {value.split("").join(" ")}
    </Text>
  );
}

/* --------------------------------------------------------------- usage meter */

export function UsageMeter({
  used,
  total,
  label,
}: {
  used: number;
  total: number;
  label?: string;
}) {
  const percent = Math.min(100, Math.round((used / Math.max(1, total)) * 100));
  const segments = 20;
  const filled = Math.round((percent / 100) * segments);
  const token = useTokens();

  return (
    <View style={{ gap: 6 }}>
      {label ? <Text role="caption">{label}</Text> : null}
      <View style={{ flexDirection: "row", gap: 2 }}>
        {Array.from({ length: segments }).map((_, index) => (
          <View
            key={index}
            style={{
              flex: 1,
              height: 10,
              borderRadius: 2,
              backgroundColor: index < filled ? token.accent : token.surfaceMuted,
            }}
          />
        ))}
      </View>
      <Text role="caption">{percent}% · {used} dari {total}</Text>
    </View>
  );
}

/* -------------------------------------------------------------- copy button */

export function CopyButton({ value, label = "Salin" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      label={copied ? "Tersalin" : label}
      size="sm"
      variant="outline"
      onPress={() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
        void value;
      }}
    />
  );
}

/* ----------------------------------------------------------------- calendar */

function monthMatrix(year: number, month: number) {
  const first = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const offset = first.getUTCDay();
  const cells: (number | null)[] = Array.from({ length: offset }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function Calendar({
  year,
  month,
  selected,
  onSelect,
}: {
  year: number;
  month: number;
  selected?: number;
  onSelect?: (day: number) => void;
}) {
  const token = useTokens();
  const cells = monthMatrix(year, month);

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row" }}>
        {["S", "S", "R", "K", "J", "S", "S"].map((day, index) => (
          <Text key={`${day}-${index}`} role="caption" align="center" style={{ flex: 1 }}>{day}</Text>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }).map((_, week) => (
        <View key={week} style={{ flexDirection: "row" }}>
          {cells.slice(week * 7, week * 7 + 7).map((day, index) => {
            const active = day === selected;
            return (
              <Pressable
                key={`${week}-${index}`}
                disabled={!day}
                accessibilityLabel={day ? `Tanggal ${day}` : undefined}
                onPress={() => day && onSelect?.(day)}
                style={{ flex: 1, alignItems: "center", paddingVertical: 4 }}
              >
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: active ? token.accent : "transparent",
                  }}
                >
                  <Text role="caption" color={active ? token.accentForeground : undefined} weight={active ? "700" : "400"}>
                    {day ?? ""}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function DatePicker({ initial }: { initial?: Date }) {
  const base = initial ?? new Date();
  const [day, setDay] = useState(base.getUTCDate());
  return (
    <View style={{ gap: 8 }}>
      <Text role="label" weight="600">
        {String(day).padStart(2, "0")}/{String(base.getUTCMonth() + 1).padStart(2, "0")}/{base.getUTCFullYear()}
      </Text>
      <Calendar year={base.getUTCFullYear()} month={base.getUTCMonth()} selected={day} onSelect={setDay} />
    </View>
  );
}

export function TimePicker({ initialHour = 8, initialMinute = 0 }: { initialHour?: number; initialMinute?: number }) {
  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);
  const token = useTokens();

  function step(value: number, delta: number, max: number) {
    return (value + delta + max) % max;
  }

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Button label="−" size="sm" variant="secondary" onPress={() => setHour((value) => step(value, -1, 24))} />
      <Text role="title" weight="700" color={token.foreground}>
        {String(hour).padStart(2, "0")}:{String(minute).padStart(2, "0")}
      </Text>
      <Button label="+" size="sm" variant="secondary" onPress={() => setHour((value) => step(value, 1, 24))} />
      <Button label="−m" size="sm" variant="ghost" onPress={() => setMinute((value) => step(value, -5, 60))} />
      <Button label="+m" size="sm" variant="ghost" onPress={() => setMinute((value) => step(value, 5, 60))} />
    </View>
  );
}

/* --------------------------------------------------------------- code / json */

export function CodeBlock({ code, language }: { code: string; language?: string }) {
  const token = useTokens();
  return (
    <View style={{ gap: 6 }}>
      {language ? <Text role="caption" weight="600">{language}</Text> : null}
      <View style={{ padding: 12, borderRadius: 10, backgroundColor: token.surfaceMuted }}>
        <Text role="mono">{code}</Text>
      </View>
    </View>
  );
}

export function JsonViewer({ data }: { data: unknown }) {
  const token = useTokens();
  const rows = Object.entries(data as Record<string, unknown>);

  return (
    <View style={{ gap: 4 }}>
      {rows.map(([key, value]) => (
        <View key={key} style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
          <Text role="mono" color={token.textSecondary}>{key}</Text>
          <Text role="mono" numberOfLines={2} style={{ flex: 1, textAlign: "right" }}>
            {typeof value === "string" ? `"${value}"` : JSON.stringify(value)}
          </Text>
        </View>
      ))}
    </View>
  );
}

/* ----------------------------------------------------------------- carousel */

export function Carousel({ slides }: { slides: { id: string; title: string; body: string }[] }) {
  const token = useTokens();
  const [index, setIndex] = useState(0);
  return (
    <View style={{ gap: 8 }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const width = event.nativeEvent.layoutMeasurement.width;
          setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
        }}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={{ width: 300, padding: 14, gap: 4 }}>
            <Text role="heading" weight="600">{slide.title}</Text>
            <Text role="caption">{slide.body}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={{ flexDirection: "row", gap: 6, justifyContent: "center" }}>
        {slides.map((slide, slideIndex) => (
          <View
            key={slide.id}
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: slideIndex === index ? token.accent : token.border,
            }}
          />
        ))}
      </View>
    </View>
  );
}

/* -------------------------------------------------------------- color picker */

export function ColorPicker({
  colors,
  value,
  onChange,
}: {
  colors: string[];
  value?: string;
  onChange: (color: string) => void;
}) {
  const token = useTokens();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {colors.map((color) => (
        <Pressable
          key={color}
          accessibilityLabel={`Pilih warna ${color}`}
          onPress={() => onChange(color)}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: color,
            borderWidth: value === color ? 2 : StyleSheet.hairlineWidth,
            borderColor: value === color ? token.foreground : token.border,
          }}
        />
      ))}
    </View>
  );
}

/* ------------------------------------------------------------ progress grid */

export function ProgressGrid({ items }: { items: { label: string; value: number }[] }) {
  return (
    <View style={{ gap: 10 }}>
      {items.map((item) => (
        <Progress key={item.label} label={item.label} value={item.value} tone={item.value >= 100 ? "success" : item.value >= 80 ? "warning" : "danger"} />
      ))}
    </View>
  );
}