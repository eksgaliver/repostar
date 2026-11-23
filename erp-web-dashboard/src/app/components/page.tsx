import type { Metadata } from "next";
import { Badge } from "@/components/arc/badge/badge";
import { ActionGallery } from "@/components/gallery/ActionGallery";
import { ArcCatalog } from "@/components/gallery/ArcCatalog";
import { PrimitiveGallery } from "@/components/gallery/PrimitiveGallery";

export const metadata: Metadata = {
  title: "Arc UI · S.T.A.R.S",
};

export default function ComponentsPage() {
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Arc UI</h1>
          <p className="max-w-2xl text-sm" style={{ color: "var(--text-secondary)" }}>
            Seluruh registry Arc UI (uiarc.dev) ditarik utuh: 128 direktori komponen + blok.
            Bagian aksi di bawah menampilkan setiap varian tombol — Button, ButtonGroup + dropdown,
            SplitButton, ActionButton, ActionSwap, ExpandingButtonGroup, FloatingButtonGroup,
            CopyButton, HoldToConfirm, ConfirmMorph, IconMorph, DropdownMenu, ContextMenu,
            ThemeSwitch (4 varian), SwipeActions, UserMenu, dan Reactions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="success" dot pill>
            128 komponen
          </Badge>
          <Badge tone="info" dot pill>
            146 item registry
          </Badge>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Aksi & tombol · lengkap</h2>
        <ActionGallery />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Primitif yang dipakai dashboard</h2>
        <PrimitiveGallery />
      </section>

      <ArcCatalog />
    </>
  );
}