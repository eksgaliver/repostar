"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/arc/badge/badge";
import { SearchField } from "@/components/arc/search-field/search-field";
import catalogJson from "@/components/arc/registry.generated.json";

interface CatalogItem {
  name: string;
  type: string;
  title?: string;
  description?: string;
  categories?: string[];
  dependencies?: string[];
  registryDependencies?: string[];
  files: { target: string }[];
}

const items = (catalogJson as { items: CatalogItem[] }).items;

const kindLabel = (type: string) => type.replace("registry:", "");

export function ArcCatalog() {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<string>("all");

  const kinds = useMemo(() => {
    const set = new Set(items.map((item) => kindLabel(item.type)));
    return ["all", ...Array.from(set).sort()];
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items
      .filter((item) => (kind === "all" ? true : kindLabel(item.type) === kind))
      .filter((item) => {
        if (!needle) return true;
        return `${item.name} ${item.title ?? ""} ${item.description ?? ""} ${(item.categories ?? []).join(" ")}`
          .toLowerCase()
          .includes(needle);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [kind, query]);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold tracking-tight">Katalog lengkap registry</h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {items.length} item Arc UI sudah di-vendor ke <code>src/components/arc</code>. Tidak ada
            komponen yang dipilih sebagian: seluruh registry ditarik utuh.
          </p>
        </div>
        <Badge tone="info" dot>
          {visible.length} tampil
        </Badge>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full max-w-sm">
          <SearchField
            label="Cari komponen"
            placeholder="button, chart, menu…"
            value={query}
            onValueChange={setQuery}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {kinds.map((entry) => (
            <button
              key={entry}
              type="button"
              onClick={() => setKind(entry)}
              className="rounded-full border px-3 py-1 text-xs"
              style={{
                borderColor: kind === entry ? "var(--accent)" : "var(--border)",
                background: kind === entry ? "var(--accent-subtle)" : "transparent",
                color: kind === entry ? "var(--foreground)" : "var(--text-secondary)",
              }}
            >
              {entry}
            </button>
          ))}
        </div>
      </div>

      <div className="arc-scroll rounded-2xl border" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-left text-sm">
          <thead
            className="sticky top-0 z-10 text-xs uppercase tracking-wider"
            style={{ background: "var(--surface-muted)", color: "var(--text-muted)" }}
          >
            <tr>
              <th className="px-4 py-3 font-medium">Komponen</th>
              <th className="px-4 py-3 font-medium">Jenis</th>
              <th className="px-4 py-3 font-medium">Kategori</th>
              <th className="px-4 py-3 font-medium">Entry</th>
              <th className="px-4 py-3 font-medium">Dependency</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => {
              const entry = item.files.find((file) => /\.(tsx|ts)$/.test(file.target))?.target ?? "-";
              const deps = [...(item.dependencies ?? []), ...(item.registryDependencies ?? [])];
              return (
                <tr key={item.name} className="border-t" style={{ borderColor: "var(--border-subtle)" }}>
                  <td className="px-4 py-2 font-medium">{item.name}</td>
                  <td className="px-4 py-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    {kindLabel(item.type)}
                  </td>
                  <td className="px-4 py-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                    {(item.categories ?? []).join(", ") || "-"}
                  </td>
                  <td className="px-4 py-2 font-mono text-[11px]" style={{ color: "var(--text-secondary)" }}>
                    {entry.replace("erp-web-dashboard/src/components/arc/", "")}
                  </td>
                  <td className="px-4 py-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {deps.join(" ") || "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}