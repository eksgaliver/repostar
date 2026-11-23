"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Alert } from "@/components/arc/alert/alert";
import { Badge } from "@/components/arc/badge/badge";
import { Button } from "@/components/arc/button/button";
import { Input } from "@/components/arc/input/input";
import { Skeleton } from "@/components/arc/skeleton/skeleton";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { apiFetch, copyFor } from "@/lib/api";

type Row = Record<string, unknown>;

export interface ResourceOption {
  id: string;
  label: string;
}

export interface ResourceField {
  name: string;
  label: string;
  kind?: "text" | "number" | "date" | "time" | "select" | "textarea";
  required?: boolean;
  hint?: string;
  placeholder?: string;
  options?: ResourceOption[];
  /** Load the options once the form opens (for relations such as regionId). */
  optionsFrom?: {
    endpoint: string;
    listKey: string;
    label: (row: Row) => string;
    value?: (row: Row) => string;
  };
  defaultValue?: string;
}

export interface ResourceColumn {
  header: string;
  cell: (row: Row) => ReactNode;
}

interface ResourcePanelProps {
  title: string;
  description: string;
  meta?: string;
  endpoint: string;
  listKey: string;
  createEndpoint?: string;
  fields: ResourceField[];
  columns: ResourceColumn[];
  numeric?: number[];
  empty?: string;
  addLabel?: string;
  rowActions?: (row: Row, reload: () => void) => ReactNode;
}

export function ResourcePanel({
  title,
  description,
  meta = "Master data",
  endpoint,
  listKey,
  createEndpoint,
  fields,
  columns,
  numeric = [],
  empty = "Belum ada data.",
  addLabel = "Tambah",
  rowActions,
}: ResourcePanelProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [options, setOptions] = useState<Record<string, ResourceOption[]>>({});

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<Record<string, Row[]>>(endpoint);
      setRows(data[listKey] ?? []);
      setError(null);
    } catch (caught) {
      setError(copyFor(caught));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint, listKey]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openForm() {
    const defaults: Record<string, string> = {};
    for (const field of fields) if (field.defaultValue) defaults[field.name] = field.defaultValue;
    setValues(defaults);
    setOpen(true);

    const withRelations = fields.filter((field) => field.optionsFrom);
    const loaded = await Promise.all(
      withRelations.map(async (field) => {
        const source = field.optionsFrom!;
        try {
          const data = await apiFetch<Record<string, Row[]>>(source.endpoint);
          const list = (data[source.listKey] ?? []).map((row) => ({
            id: source.value ? source.value(row) : String(row.id ?? ""),
            label: source.label(row),
          }));
          return [field.name, list] as const;
        } catch {
          return [field.name, []] as const;
        }
      }),
    );
    setOptions(Object.fromEntries(loaded));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = {};
    for (const field of fields) {
      const raw = values[field.name];
      if (raw === undefined || raw === "") continue;
      payload[field.name] = field.kind === "number" ? Number(raw) : raw;
    }

    try {
      await apiFetch(createEndpoint ?? endpoint, { method: "POST", body: JSON.stringify(payload) });
      setOpen(false);
      await load();
    } catch (caught) {
      setError(copyFor(caught));
    } finally {
      setSaving(false);
    }
  }

  const tableRows = rows.map((row) => [
    ...columns.map((column) => column.cell(row)),
    ...(rowActions ? [rowActions(row, load)] : []),
  ]);

  return (
    <Card
      title={title}
      description={description}
      meta={meta}
      status={loading ? "…" : `${rows.length} baris`}
      action={
        <Button size="sm" variant="secondary" onClick={openForm}>
          {addLabel}
        </Button>
      }
    >
      {error ? (
        <Alert tone={rows.length ? "warning" : "danger"} title="Gagal memuat" open>
          {error}
        </Alert>
      ) : null}

      {open ? (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => {
              if (field.kind === "select") {
                const list = field.options ?? options[field.name] ?? [];
                return (
                  <label key={field.name} className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
                      {field.label}
                      {field.required ? " *" : ""}
                    </span>
                    <select
                      required={field.required}
                      value={values[field.name] ?? ""}
                      onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                      className="resource-select"
                    >
                      <option value="">Pilih {field.label.toLowerCase()}…</option>
                      {list.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {field.hint ? (
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {field.hint}
                      </span>
                    ) : null}
                  </label>
                );
              }

              return (
                <Input
                  key={field.name}
                  label={`${field.label}${field.required ? " *" : ""}`}
                  type={field.kind === "number" ? "number" : field.kind === "date" ? "date" : field.kind === "time" ? "time" : "text"}
                  required={field.required}
                  placeholder={field.placeholder}
                  description={field.hint}
                  value={values[field.name] ?? ""}
                  onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                />
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" loading={saving} disabled={saving}>
              Simpan
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Batal
            </Button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <Skeleton lines={3} />
      ) : (
        <Table
          minWidth={560}
          numeric={numeric}
          empty={empty}
          head={[...columns.map((column) => column.header), ...(rowActions ? ["Aksi"] : [])]}
          rows={tableRows}
        />
      )}

      <div className="flex items-center gap-2">
        <Badge size="sm" pill tone="info">
          {listKey}
        </Badge>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {endpoint}
        </span>
      </div>
    </Card>
  );
}