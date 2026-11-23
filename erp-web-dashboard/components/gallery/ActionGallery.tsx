"use client";

import { useState } from "react";
import {
  Archive,
  ArrowRight,
  Bell,
  Download,
  Heart,
  Pencil,
  Send,
  Share2,
  Star,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/arc/button/button";
import { ButtonGroup } from "@/components/arc/button-group/button-group";
import { SplitButton } from "@/components/arc/split-button/split-button";
import { ActionButton } from "@/components/arc/action-button/action-button";
import { ActionSwap } from "@/components/arc/action-swap/action-swap";
import { ExpandingButtonGroup } from "@/components/arc/expanding-button-group/expanding-button-group";
import { FloatingButtonGroup } from "@/components/arc/floating-button-group/floating-button-group";
import { CopyButton } from "@/components/arc/copy-button/copy-button";
import { HoldToConfirm } from "@/components/arc/hold-to-confirm/hold-to-confirm";
import { ConfirmMorph } from "@/components/arc/confirm-morph/confirm-morph";
import {
  IconMorph,
  MenuIcon,
  PlayPauseIcon,
  PlusCheckIcon,
  SunMoonIcon,
} from "@/components/arc/icon-morph/icon-morph";
import { DropdownMenu } from "@/components/arc/dropdown-menu/dropdown-menu";
import { ContextMenu } from "@/components/arc/context-menu/context-menu";
import { ThemeSwitch } from "@/components/arc/theme-switch/theme-switch";
import { SwipeActionsRow } from "@/components/arc/swipe-actions/swipe-actions";
import { UserMenu } from "@/components/arc/user-menu/user-menu";
import { Reactions } from "@/components/arc/reactions/reactions";

function Tile({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="demo-tile">
      <span>{name}</span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

/** Every action-family component in the registry, in one place. */
export function ActionGallery() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [added, setAdded] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  function applyTheme(next: "light" | "dark") {
    setTheme(next);
    document.documentElement.dataset.theme = next;
  }

  return (
    <div className="gallery-grid">
      <Tile name="Button · semua varian">
        <Button size="sm">Primary</Button>
        <Button size="sm" variant="secondary">
          Secondary
        </Button>
        <Button size="sm" variant="ghost">
          Ghost
        </Button>
        <Button size="sm" variant="danger">
          Danger
        </Button>
        <Button size="sm" loading>
          Loading
        </Button>
        <Button size="sm" disabled>
          Disabled
        </Button>
      </Tile>

      <Tile name="Button · morph label (ukuran ikut label baru)">
        <Button size="sm" variant="secondary">
          {menuOpen ? "Tutup panel" : "Buka panel"}
          <ArrowRight size={14} />
        </Button>
        <Button size="sm" onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? "Tersimpan" : "Simpan"}
        </Button>
      </Tile>

      <Tile name="ButtonGroup + dropdown menu">
        <ButtonGroup
          label="Aksi dokumen"
          items={[
            { id: "edit", label: "Edit", icon: <Pencil size={14} />, onSelect: () => undefined },
            { id: "share", label: "Share", icon: <Share2 size={14} />, reserve: ["Copied"], onSelect: () => undefined },
          ]}
          menu={{
            label: "Aksi lainnya",
            items: [
              { id: "download", label: "Unduh", icon: <Download size={14} />, onSelect: () => undefined },
              { id: "archive", label: "Arsipkan", icon: <Archive size={14} />, onSelect: () => undefined },
              { id: "delete", label: "Hapus", icon: <Trash2 size={14} />, destructive: true, onSelect: () => undefined },
            ],
          }}
        />
      </Tile>

      <Tile name="ButtonGroup · solid + vertikal">
        <ButtonGroup
          label="Filter status"
          variant="solid"
          size="sm"
          items={[
            { id: "all", label: "Semua", onSelect: () => undefined },
            { id: "late", label: "Terlambat", onSelect: () => undefined },
            { id: "alfa", label: "Alfa", onSelect: () => undefined },
          ]}
        />
        <ButtonGroup
          label="Navigasi vertikal"
          orientation="vertical"
          size="sm"
          items={[
            { id: "km", label: "KM", onSelect: () => undefined },
            { id: "nup", label: "NUP", onSelect: () => undefined },
          ]}
        />
      </Tile>

      <Tile name="SplitButton">
        <SplitButton
          label="Kirim DO"
          icon={<Send size={14} />}
          actions={[
            { label: "Kirim & cetak", onSelect: () => undefined },
            { label: "Kirim nanti", onSelect: () => undefined },
            { label: "Batalkan", destructive: true, onSelect: () => undefined },
          ]}
        />
      </Tile>

      <Tile name="ActionButton · async + status">
        <ActionButton
          label="Simpan matriks"
          successLabel="Tersimpan"
          pendingLabel="Menyimpan"
          onAction={async () => {
            await new Promise((resolve) => setTimeout(resolve, 900));
          }}
        />
      </Tile>

      <Tile name="ActionSwap · multi state">
        <ActionSwap
          states={[
            { id: "draft", label: "Draft", tone: "quiet" },
            { id: "review", label: "Review", tone: "warning", pendingLabel: "Mengirim" },
            { id: "done", label: "Disetujui", tone: "success", holdFor: 1600 },
          ]}
          defaultValue="draft"
        />
      </Tile>

      <Tile name="ExpandingButtonGroup">
        <ExpandingButtonGroup
          label="Aksi unit"
          defaultExpanded="archive"
          items={[
            {
              id: "archive",
              label: "Arsipkan",
              icon: <Archive size={16} />,
              doneLabel: "Diarsipkan",
              onSelect: () => undefined,
            },
            { id: "send", label: "Kirim", icon: <Send size={16} />, onSelect: () => undefined },
            {
              id: "delete",
              label: "Hapus",
              icon: <Trash2 size={16} />,
              doneLabel: "Terhapus",
              onSelect: () => undefined,
            },
          ]}
        />
      </Tile>

      <Tile name="FloatingButtonGroup">
        <FloatingButtonGroup
          label="Aksi papan"
          variant="floating"
          items={[
            { id: "edit", label: "Edit", icon: <Pencil size={14} />, onSelect: () => undefined },
            { id: "share", label: "Bagikan", icon: <Share2 size={14} />, onSelect: () => undefined },
            { type: "separator", id: "sep" },
            { id: "delete", label: "Hapus", icon: <Trash2 size={14} />, onSelect: () => undefined },
          ]}
        />
        <FloatingButtonGroup
          label="Ikon saja"
          iconOnly
          size="sm"
          items={[
            { id: "bell", label: "Notifikasi", icon: <Bell size={14} />, onSelect: () => undefined },
            { id: "star", label: "Favorit", icon: <Star size={14} />, onSelect: () => undefined },
          ]}
        />
      </Tile>

      <Tile name="CopyButton">
        <CopyButton value="PK.D.001" label="Copy ID" />
        <CopyButton value="DO-202611-001" iconOnly variant="plain" />
      </Tile>

      <Tile name="HoldToConfirm">
        <HoldToConfirm
          label="Tahan untuk hapus unit"
          confirmedLabel="Terhapus"
          onConfirm={() => undefined}
          duration={1100}
          icon={<Trash2 size={15} />}
        />
      </Tile>

      <Tile name="ConfirmMorph · press / hold / countdown">
        <ConfirmMorph
          label="Tutup cutoff"
          prompt="Tutup cutoff November?"
          confirmLabel="Tutup"
          pendingLabel="Menutup"
          doneLabel="Ditutup"
          tone="neutral"
          onConfirm={async () => {
            await new Promise((resolve) => setTimeout(resolve, 700));
          }}
        />
        <ConfirmMorph
          label="Hapus rute"
          prompt="Hapus rute PKU-DMI?"
          confirmMode="hold"
          onConfirm={() => undefined}
        />
        <ConfirmMorph label="Reset target" confirmMode="countdown" countdown={3} onConfirm={() => undefined} />
      </Tile>

      <Tile name="IconMorph">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border"
          style={{ borderColor: "var(--border)" }}
          aria-label="Toggle menu"
        >
          <MenuIcon state={menuOpen} />
        </button>
        <button
          type="button"
          onClick={() => setPlaying((value) => !value)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border"
          style={{ borderColor: "var(--border)" }}
          aria-label="Play or pause"
        >
          <PlayPauseIcon state={playing} />
        </button>
        <button
          type="button"
          onClick={() => setAdded((value) => !value)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border"
          style={{ borderColor: "var(--border)" }}
          aria-label="Add"
        >
          <PlusCheckIcon state={added} />
        </button>
        <SunMoonIcon state={theme === "dark"} />
        <IconMorph name="heart" state={added} />
      </Tile>

      <Tile name="DropdownMenu">
        <DropdownMenu
          label="Aksi"
          items={[
            { label: "Edit karyawan", icon: <Pencil size={14} /> },
            { label: "Reset password" },
            { separatorBefore: true, label: "Nonaktifkan", destructive: true },
          ]}
        />
      </Tile>

      <Tile name="ContextMenu · klik kanan">
        <ContextMenu
          label="Menu baris matriks"
          items={[
            { id: "status", label: "Ubah status", onSelect: () => undefined },
            { id: "info", label: "Isi informasi", onSelect: () => undefined },
            { id: "st", label: "Tandai S.T", onSelect: () => undefined },
            { id: "delete", label: "Hapus baris", destructive: true, onSelect: () => undefined },
          ]}
        >
          <span
            className="rounded-lg border px-3 py-2 text-xs"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            Klik kanan di sini
          </span>
        </ContextMenu>
      </Tile>

      <Tile name="ThemeSwitch · 4 varian">
        <ThemeSwitch theme={theme} onThemeChange={applyTheme} />
        <ThemeSwitch theme={theme} variant="eclipse" onThemeChange={applyTheme} iconOnly />
        <ThemeSwitch theme={theme} variant="split" onThemeChange={applyTheme} iconOnly />
        <ThemeSwitch theme={theme} variant="rise" onThemeChange={applyTheme} iconOnly />
      </Tile>

      <Tile name="SwipeActions · geser baris">
        <div className="w-full">
          <SwipeActionsRow
            label="Baris karyawan"
            trailing={[
              { label: "Arsip", icon: <Archive size={16} />, tone: "accent", onSelect: () => undefined },
              { label: "Hapus", icon: <Trash2 size={16} />, tone: "danger", onSelect: () => undefined },
            ]}
          >
            <span className="text-sm">PK.D.001 · Andi Saputra</span>
          </SwipeActionsRow>
        </div>
      </Tile>

      <Tile name="UserMenu">
        <UserMenu
          user={{ name: "Super Admin", email: "superadmin@stars.local", plan: "WMPL" }}
          status="available"
          items={[
            { label: "Profil" },
            { label: "Preferensi" },
            { label: "Keluar", onSelect: () => undefined },
          ]}
        />
      </Tile>

      <Tile name="Reactions">
        <Reactions
          options={[
            { id: "like", label: "Suka", icon: ThumbsUp },
            { id: "love", label: "Suka sekali", icon: Heart },
            { id: "star", label: "Penting", icon: Star },
          ]}
          defaultValue={[{ id: "like", count: 3, reacted: false }]}
        />
      </Tile>
    </div>
  );
}