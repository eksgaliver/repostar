"use client";

import { useMemo, useState } from "react";
import { ChipGroup } from "@/components/arc/chip-group/chip-group";
import { SearchField } from "@/components/arc/search-field/search-field";
import { Muted } from "@/components/ui/Table";

export interface SearchableOption {
  value: string;
  label: string;
  /** Extra words the search should match, such as the parent provinsi. */
  keywords?: readonly string[];
}

export interface SearchableMultiSelectProps {
  /** Group name announced for the chips, e.g. "Provinsi operasional". */
  label: string;
  searchLabel: string;
  options: SearchableOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  /** Chips shown before the rest fold behind "+N more". */
  maxVisible?: number;
  disabled?: boolean;
}

/**
 * Arc ships a search field and a multi-select chip group but no searchable
 * multi-select, so this composes the two: the field narrows the set, the chips
 * toggle values. Already-picked values stay visible even when the query hides
 * them, so a search never strands a selection.
 */
export function SearchableMultiSelect({
  label,
  searchLabel,
  options,
  value,
  onValueChange,
  placeholder = "Pilih salah satu atau lebih",
  emptyMessage = "Tidak ada pilihan yang cocok.",
  maxVisible = 8,
  disabled = false,
}: SearchableMultiSelectProps) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    const picked = new Set(value);
    return options.filter((option) => {
      if (picked.has(option.value)) return true;
      const haystack = [option.label, ...(option.keywords ?? [])].join(" ").toLowerCase();
      return haystack.includes(needle);
    });
  }, [options, query, value]);

  return (
    <div className="flex flex-col gap-3">
      <SearchField
        label={searchLabel}
        value={query}
        onValueChange={setQuery}
        placeholder={placeholder}
        disabled={disabled}
      />

      {visible.length ? (
        <ChipGroup
          label={label}
          options={visible.map((option) => ({ value: option.value, label: option.label }))}
          value={value}
          onValueChange={onValueChange}
          multiple
          maxVisible={maxVisible}
        />
      ) : (
        <Muted>{emptyMessage}</Muted>
      )}

      {query.trim() ? (
        <Muted>
          {visible.length} dari {options.length} pilihan cocok dengan “{query.trim()}”. Pilihan yang sudah
          dicentang tetap tampil.
        </Muted>
      ) : null}
    </div>
  );
}