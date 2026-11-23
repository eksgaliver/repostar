export interface NavItem {
  href: string;
  label: string;
  hint: string;
  /** Lucide icon name, resolved in the shell. */
  icon: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/**
 * Only the two workspaces wired so far: Fixex (dashboard + perusahaan) and
 * Human Resources (karyawan). Every other page keeps its file but stays out of
 * the menu until its own workspace is rebuilt.
 */
export const navigation: NavGroup[] = [
  {
    title: "Fixex",
    items: [
      { href: "/fixex", label: "Dashboard", hint: "Sapaan", icon: "dashboard" },
      { href: "/perusahaan", label: "Perusahaan", hint: "Profil, warna, wilayah", icon: "building" },
    ],
  },
  {
    title: "Human Resources",
    items: [
      { href: "/human-resources/karyawan", label: "Karyawan", hint: "Biodata & onboarding", icon: "users" },
      { href: "/human-resources/departemen", label: "Departemen", hint: "Tim & anggota", icon: "git-branch" },
    ],
  },
  {
    title: "Komunikasi",
    items: [
      { href: "/komunikasi/dokumen", label: "Dokumen", hint: "Surat, memo & tanda tangan", icon: "file-text" },
    ],
  },
];

export interface NavMatch {
  group: string;
  item: NavItem;
}

/** Longest matching nav entry for the current path, used by the breadcrumb. */
export function matchNav(pathname: string): NavMatch | null {
  let best: NavMatch | null = null;
  for (const group of navigation) {
    for (const item of group.items) {
      const hit = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
      if (!hit) continue;
      if (!best || item.href.length > best.item.href.length) best = { group: group.title, item };
    }
  }
  return best;
}