import { useState } from "react";
import type { ReactNode } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import type { KeyboardTypeOptions } from "react-native";
import { Text } from "./foundation";
import { useTokens } from "./theme";

/* ------------------------------------------------------------------- field */

export interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

export function Field({ label, hint, error, required, children }: FieldProps) {
  const token = useTokens();
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Text role="label" weight="600">
          {label}
          {required ? <Text color={token.danger}> *</Text> : null}
        </Text>
      ) : null}
      {children}
      {error ? (
        <Text role="caption" color={token.danger}>{error}</Text>
      ) : hint ? (
        <Text role="caption">{hint}</Text>
      ) : null}
    </View>
  );
}

function shellStyle(focused: boolean, error: boolean, tokens: ReturnType<typeof useTokens>) {
  return {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: error ? tokens.danger : focused ? tokens.accent : tokens.border,
    backgroundColor: tokens.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 44,
    justifyContent: "center" as const,
  };
}

/* ------------------------------------------------------------------- input */

export interface InputProps {
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  editable?: boolean;
  left?: ReactNode;
  right?: ReactNode;
  maxLength?: number;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  hint,
  error,
  required,
  keyboardType,
  secureTextEntry,
  autoCapitalize = "sentences",
  editable = true,
  left,
  right,
  maxLength,
}: InputProps) {
  const token = useTokens();
  const [focused, setFocused] = useState(false);

  return (
    <Field label={label} hint={hint} error={error} required={required}>
      <View style={{ ...shellStyle(focused, Boolean(error), token), flexDirection: "row", alignItems: "center", gap: 8 }}>
        {left}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={token.textMuted}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          editable={editable}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ flex: 1, color: token.foreground, fontSize: 15, paddingVertical: 10 }}
        />
        {right}
      </View>
    </Field>
  );
}

export function Textarea({
  value,
  onChangeText,
  placeholder,
  label,
  hint,
  error,
  rows = 4,
}: {
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  label?: string;
  hint?: string;
  error?: string;
  rows?: number;
}) {
  const token = useTokens();
  const [focused, setFocused] = useState(false);
  return (
    <Field label={label} hint={hint} error={error}>
      <View style={shellStyle(focused, Boolean(error), token)}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={token.textMuted}
          multiline
          numberOfLines={rows}
          textAlignVertical="top"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ minHeight: rows * 22, color: token.foreground, fontSize: 15, paddingVertical: 10 }}
        />
      </View>
    </Field>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder = "Cari…",
  label,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  label?: string;
}) {
  const token = useTokens();
  return (
    <Field label={label}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          borderRadius: 999,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: token.border,
          backgroundColor: token.surfaceMuted,
          paddingHorizontal: 12,
          minHeight: 40,
        }}
      >
        <Text role="caption">⌕</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={token.textMuted}
          style={{ flex: 1, color: token.foreground, fontSize: 14 }}
        />
        {value ? (
          <Pressable accessibilityLabel="Hapus pencarian" onPress={() => onChange("")}>
            <Text role="caption">✕</Text>
          </Pressable>
        ) : null}
      </View>
    </Field>
  );
}

export function PasswordField({
  value,
  onChangeText,
  label = "Password",
  error,
}: {
  value: string;
  onChangeText: (next: string) => void;
  label?: string;
  error?: string;
}) {
  const [hidden, setHidden] = useState(true);
  return (
    <Input
      label={label}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={hidden}
      autoCapitalize="none"
      error={error}
      right={
        <Pressable accessibilityLabel={hidden ? "Tampilkan password" : "Sembunyikan password"} onPress={() => setHidden((v) => !v)}>
          <Text role="caption">{hidden ? "Lihat" : "Tutup"}</Text>
        </Pressable>
      }
    />
  );
}

export function NumberField({
  value,
  onChange,
  label,
  hint,
  error,
  suffix,
}: {
  value: number;
  onChange: (next: number) => void;
  label?: string;
  hint?: string;
  error?: string;
  suffix?: string;
}) {
  return (
    <Input
      label={label}
      hint={hint}
      error={error}
      value={String(value)}
      keyboardType="numeric"
      onChangeText={(text) => {
        const parsed = Number(text.replace(/[^0-9.-]/g, ""));
        onChange(Number.isFinite(parsed) ? parsed : 0);
      }}
      right={suffix ? <Text role="caption">{suffix}</Text> : undefined}
    />
  );
}

export function MoneyInput({
  value,
  onChange,
  label = "Nominal",
  hint,
}: {
  value: number;
  onChange: (next: number) => void;
  label?: string;
  hint?: string;
}) {
  return (
    <Input
      label={label}
      hint={hint}
      keyboardType="numeric"
      value={new Intl.NumberFormat("id-ID").format(value)}
      onChangeText={(text) => {
        const parsed = Number(text.replace(/[^0-9]/g, ""));
        onChange(Number.isFinite(parsed) ? parsed : 0);
      }}
      left={<Text role="caption" weight="600">Rp</Text>}
    />
  );
}

/* --------------------------------------------------------------- tag input */

export function TagInput({
  tags,
  onChange,
  label,
  placeholder = "Tambah tag lalu enter",
}: {
  tags: string[];
  onChange: (next: string[]) => void;
  label?: string;
  placeholder?: string;
}) {
  const token = useTokens();
  const [draft, setDraft] = useState("");

  function commit() {
    const value = draft.trim();
    if (!value || tags.includes(value)) return;
    onChange([...tags, value]);
    setDraft("");
  }

  return (
    <Field label={label}>
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {tags.map((tag) => (
            <Pressable
              key={tag}
              accessibilityLabel={`Hapus ${tag}`}
              onPress={() => onChange(tags.filter((entry) => entry !== tag))}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 999,
                backgroundColor: token.accentSubtle,
              }}
            >
              <Text role="caption" weight="600">{tag}</Text>
              <Text role="caption">✕</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ ...shellStyle(false, false, token), flexDirection: "row", alignItems: "center" }}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={commit}
            placeholder={placeholder}
            placeholderTextColor={token.textMuted}
            style={{ flex: 1, color: token.foreground, fontSize: 14, paddingVertical: 10 }}
          />
        </View>
      </View>
    </Field>
  );
}

/* ------------------------------------------------------------------ select */

export interface SelectOption {
  id: string;
  label: string;
  hint?: string;
}

function OptionSheet({
  visible,
  title,
  options,
  selected,
  multiple,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  options: SelectOption[];
  selected: string[];
  multiple: boolean;
  onClose: () => void;
  onSelect: (next: string[]) => void;
}) {
  const token = useTokens();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "#00000066" }} onPress={onClose} />
      <View
        style={{
          backgroundColor: token.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 16,
          gap: 8,
          maxHeight: "70%",
          borderTopWidth: StyleSheet.hairlineWidth,
          borderColor: token.border,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text role="heading" weight="600">{title}</Text>
          <Pressable onPress={onClose} accessibilityLabel="Tutup">
            <Text role="caption" weight="600">Tutup</Text>
          </Pressable>
        </View>
        {options.map((option) => {
          const active = selected.includes(option.id);
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => {
                if (multiple) {
                  onSelect(active ? selected.filter((id) => id !== option.id) : [...selected, option.id]);
                } else {
                  onSelect([option.id]);
                  onClose();
                }
              }}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderRadius: 12,
                backgroundColor: active ? token.accentSubtle : "transparent",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text weight={active ? "600" : "400"}>{option.label}</Text>
                {option.hint ? <Text role="caption">{option.hint}</Text> : null}
              </View>
              {active ? <Text weight="600">✓</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </Modal>
  );
}

export function Select({
  options,
  value,
  onChange,
  label,
  placeholder = "Pilih…",
}: {
  options: SelectOption[];
  value?: string;
  onChange: (id: string) => void;
  label?: string;
  placeholder?: string;
}) {
  const token = useTokens();
  const [open, setOpen] = useState(false);
  const current = options.find((option) => option.id === value);

  return (
    <Field label={label}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label ?? placeholder}
        onPress={() => setOpen(true)}
        style={{ ...shellStyle(false, false, token), flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
      >
        <Text color={current ? token.foreground : token.textMuted}>{current?.label ?? placeholder}</Text>
        <Text role="caption">▾</Text>
      </Pressable>
      <OptionSheet
        visible={open}
        title={label ?? placeholder}
        options={options}
        selected={value ? [value] : []}
        multiple={false}
        onClose={() => setOpen(false)}
        onSelect={(next) => next[0] && onChange(next[0])}
      />
    </Field>
  );
}

export function MultiSelect({
  options,
  values,
  onChange,
  label,
  placeholder = "Pilih beberapa…",
}: {
  options: SelectOption[];
  values: string[];
  onChange: (next: string[]) => void;
  label?: string;
  placeholder?: string;
}) {
  const token = useTokens();
  const [open, setOpen] = useState(false);
  const summary = options
    .filter((option) => values.includes(option.id))
    .map((option) => option.label)
    .join(", ");

  return (
    <Field label={label}>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={{ ...shellStyle(false, false, token), flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
      >
        <Text color={summary ? token.foreground : token.textMuted} numberOfLines={1} style={{ flex: 1 }}>
          {summary || placeholder}
        </Text>
        <Text role="caption">▾</Text>
      </Pressable>
      <OptionSheet
        visible={open}
        title={label ?? placeholder}
        options={options}
        selected={values}
        multiple
        onClose={() => setOpen(false)}
        onSelect={onChange}
      />
    </Field>
  );
}

/* -------------------------------------------------------------- inline edit */

export function InlineEdit({
  value,
  onSave,
  label,
}: {
  value: string;
  onSave: (next: string) => void;
  label?: string;
}) {
  const token = useTokens();
  const [draft, setDraft] = useState(value);
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setDraft(value);
          setEditing(true);
        }}
        style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}
      >
        <View style={{ flex: 1 }}>
          {label ? <Text role="caption">{label}</Text> : null}
          <Text>{value}</Text>
        </View>
        <Text role="caption" weight="600">Ubah</Text>
      </Pressable>
    );
  }

  return (
    <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        autoFocus
        style={{
          flex: 1,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: token.accent,
          borderRadius: 10,
          paddingHorizontal: 10,
          paddingVertical: 8,
          color: token.foreground,
        }}
        onSubmitEditing={() => {
          onSave(draft);
          setEditing(false);
        }}
      />
      <Pressable
        onPress={() => {
          onSave(draft);
          setEditing(false);
        }}
      >
        <Text role="caption" weight="600">Simpan</Text>
      </Pressable>
      <Pressable onPress={() => setEditing(false)}>
        <Text role="caption">Batal</Text>
      </Pressable>
    </View>
  );
}