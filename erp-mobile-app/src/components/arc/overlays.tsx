import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Animated, Modal, Pressable, StyleSheet, View } from "react-native";
import { Text } from "./foundation";
import { useTokens } from "./theme";

/* ------------------------------------------------------------------- sheet */

export function BottomSheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const token = useTokens();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "#00000066" }} onPress={onClose} />
      <View
        style={{
          backgroundColor: token.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 20,
          gap: 14,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderColor: token.border,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text role="heading" weight="600">{title}</Text>
          <Pressable accessibilityLabel="Tutup" onPress={onClose}>
            <Text role="caption" weight="600">Tutup</Text>
          </Pressable>
        </View>
        {children}
      </View>
    </Modal>
  );
}

export function Dialog({
  visible,
  title,
  description,
  onClose,
  children,
  footer,
}: {
  visible: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  const token = useTokens();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#00000066", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <View
          style={{
            width: "100%",
            maxWidth: 420,
            backgroundColor: token.surface,
            borderRadius: 18,
            padding: 20,
            gap: 12,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: token.border,
          }}
        >
          <Text role="heading" weight="600">{title}</Text>
          {description ? <Text role="caption">{description}</Text> : null}
          {children}
          {footer ? <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

/* -------------------------------------------------------------------- menu */

export interface MenuItem {
  id: string;
  label: string;
  hint?: string;
  destructive?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}

export function Menu({
  visible,
  items,
  onClose,
  title = "Aksi",
}: {
  visible: boolean;
  items: MenuItem[];
  onClose: () => void;
  title?: string;
}) {
  const token = useTokens();
  return (
    <BottomSheet visible={visible} title={title} onClose={onClose}>
      {items.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          accessibilityState={{ disabled: item.disabled }}
          disabled={item.disabled}
          onPress={() => {
            item.onSelect?.();
            onClose();
          }}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 12,
            borderRadius: 12,
            backgroundColor: token.surfaceMuted,
            opacity: item.disabled ? 0.5 : 1,
          }}
        >
          <Text weight={item.destructive ? "600" : "400"} color={item.destructive ? token.danger : undefined}>
            {item.label}
          </Text>
          {item.hint ? <Text role="caption">{item.hint}</Text> : null}
        </Pressable>
      ))}
    </BottomSheet>
  );
}

/* -------------------------------------------------------------------- menu */

export function DropdownMenu({ label, items }: { label: string; items: MenuItem[] }) {
  const token = useTokens();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(true)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 10,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: token.border,
        }}
      >
        <Text role="label" weight="600">{label}</Text>
        <Text role="caption">▾</Text>
      </Pressable>
      <Menu visible={open} items={items} title={label} onClose={() => setOpen(false)} />
    </>
  );
}

/* ------------------------------------------------------------------- toast */

export interface ToastMessage {
  id: string;
  message: string;
  tone?: "neutral" | "success" | "danger" | "warning";
}

export function ToastStack({
  messages,
  onDismiss,
}: {
  messages: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  const token = useTokens();
  return (
    <View style={{ position: "absolute", left: 16, right: 16, bottom: 24, gap: 8 }}>
      {messages.map((message) => {
        const color =
          message.tone === "success"
            ? token.toneGreen
            : message.tone === "danger"
              ? token.danger
              : message.tone === "warning"
                ? token.warning
                : token.textSecondary;
        return (
          <AnimatedToast key={message.id} onDismiss={() => onDismiss(message.id)}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                padding: 12,
                borderRadius: 12,
                backgroundColor: token.surface,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: color,
              }}
            >
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
              <Text style={{ flex: 1 }}>{message.message}</Text>
              <Pressable accessibilityLabel="Tutup notifikasi" onPress={() => onDismiss(message.id)}>
                <Text role="caption">✕</Text>
              </Pressable>
            </View>
          </AnimatedToast>
        );
      })}
    </View>
  );
}

function AnimatedToast({ children, onDismiss }: { children: ReactNode; onDismiss: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
    // onDismiss identity changes every render; timer only needs to arm once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}

/** Tiny hook so screens can push toasts without a global store. */
export function useToasts() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  return {
    messages,
    push: (message: string, tone?: ToastMessage["tone"]) =>
      setMessages((current) => [...current, { id: `${Date.now()}-${Math.random()}`, message, tone }]),
    dismiss: (id: string) => setMessages((current) => current.filter((entry) => entry.id !== id)),
  };
}

/* --------------------------------------------------------------- confirm */

export function ConfirmDialog({
  visible,
  title,
  description,
  confirmLabel = "Lanjutkan",
  destructive = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const token = useTokens();
  return (
    <Dialog
      visible={visible}
      title={title}
      description={description}
      onClose={onCancel}
      footer={
        <>
          <Pressable onPress={onCancel} style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
            <Text role="label" weight="600">Batal</Text>
          </Pressable>
          <Pressable
            onPress={onConfirm}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: destructive ? token.danger : token.accent,
            }}
          >
            <Text role="label" weight="600" color={token.accentForeground}>
              {confirmLabel}
            </Text>
          </Pressable>
        </>
      }
    />
  );
}