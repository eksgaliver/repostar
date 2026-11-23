"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Building2,
  CalendarCheck2,
  FileSpreadsheet,
  FileText,
  GitBranch,
  Globe2,
  LayoutDashboard,
  Network,
  Package,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Truck,
  UserCog,
  Users,
} from "lucide-react";
import { Badge } from "@/components/arc/badge/badge";
import { DropdownMenu } from "@/components/arc/dropdown-menu/dropdown-menu";
import { SearchField } from "@/components/arc/search-field/search-field";
import { ThemeSwitch } from "@/components/arc/theme-switch/theme-switch";
import { UserMenu } from "@/components/arc/user-menu/user-menu";
import { matchNav, navigation } from "@/lib/navigation";
import { useBreadcrumbSegments } from "@/lib/breadcrumbs";
import { fetchCompanies } from "@/lib/company";
import type { CompanyRow } from "@/lib/company";
import { roleByValue, roles } from "@/lib/roles";
import { hydrateRole, setRole, useRole } from "@/lib/role-store";

const ICONS: Record<string, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  building: Building2,
  palette: Palette,
  network: Network,
  "git-branch": GitBranch,
  users: Users,
  truck: Truck,
  calendar: CalendarCheck2,
  package: Package,
  sheet: FileSpreadsheet,
  globe: Globe2,
  user: UserCog,
  "file-text": FileText,
};

type Theme = "light" | "dark";

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const [query, setQuery] = useState("");
  /** The hint only prints once the platform is known, so the server markup stays neutral. */
  const [shortcut, setShortcut] = useState("");
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("stars:nav");
    if (stored === "collapsed") setCollapsed(true);
    const storedCompany = window.localStorage.getItem("stars:active-company");
    if (storedCompany) setActiveCompanyId(storedCompany);
    hydrateRole();
    const storedTheme = window.localStorage.getItem("stars:theme");
    if (storedTheme === "dark") {
      setTheme("dark");
      document.documentElement.dataset.theme = "dark";
    }
  }, []);

  // The sidebar switcher lists the real tenants once, then keeps them for the session.
  useEffect(() => {
    let alive = true;
    fetchCompanies().then(({ rows }) => {
      if (alive) setCompanies(rows);
    });
    return () => {
      alive = false;
    };
  }, []);

  // ⌘K / Ctrl+K jumps to the sidebar search, as hinted on the field.
  useEffect(() => {
    setShortcut(/Mac|iPhone|iPad|iPod/.test(navigator.platform) ? "⌘K" : "Ctrl K");
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function toggleNav() {
    setCollapsed((value) => {
      window.localStorage.setItem("stars:nav", value ? "expanded" : "collapsed");
      return !value;
    });
  }

  function toggleTheme(next: Theme) {
    setTheme(next);
    window.localStorage.setItem("stars:theme", next);
    document.documentElement.dataset.theme = next;
  }

  const match = matchNav(pathname);
  const trail = useBreadcrumbSegments();
  const role = roleByValue(useRole());

  const activeCompany =
    companies.find((company) => company.id === (pathname.split("/")[2] ?? activeCompanyId)) ??
    companies[0] ??
    null;

  // Remember the tenant last opened, so the crumb can still name it on the list page.
  const pathCompanyId = pathname.split("/")[2];
  useEffect(() => {
    if (!pathCompanyId) return;
    if (!companies.some((company) => company.id === pathCompanyId)) return;
    setActiveCompanyId(pathCompanyId);
    window.localStorage.setItem("stars:active-company", pathCompanyId);
  }, [pathCompanyId, companies]);

  const workspaceItems = [
    ...companies.map((company) => ({
      label: `${company.code} · ${company.name}`,
      onSelect: () => router.push(`/perusahaan/${company.id}`),
    })),
    {
      label: "Semua perusahaan",
      separatorBefore: companies.length > 0,
      onSelect: () => router.push("/perusahaan"),
    },
    { label: "Tambah perusahaan", onSelect: () => router.push("/perusahaan/new") },
  ];

  // Inside Fixex the first crumb is the tenant being worked on, not the product name.
  const groupLabel = match?.group === "Fixex" && activeCompany ? activeCompany.name : match?.group;

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return navigation
      .flatMap((group) => group.items.map((item) => ({ group: group.title, item })))
      .filter((entry) => `${entry.item.label} ${entry.item.hint} ${entry.group}`.toLowerCase().includes(needle))
      .slice(0, 6);
  }, [query]);

  return (
    <div className="shell-grid" data-collapsed={collapsed ? "" : undefined}>
      <aside className="app-sidebar">
        <div className="app-sidebar__head">
          <Link href="/" className="app-brand-mark" aria-label="S.T.A.R.S">
            ✳
          </Link>
          {collapsed ? null : (
            <div className="app-workspace">
              <DropdownMenu
                label={activeCompany ? activeCompany.code : "WMPL"}
                icon={null}
                items={workspaceItems}
              />
            </div>
          )}
          <button
            type="button"
            className="app-icon-button"
            onClick={toggleNav}
            aria-label={collapsed ? "Perluas navigasi" : "Ciutkan navigasi"}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        {collapsed ? null : (
          <div className="app-search">
            <SearchField
              ref={searchRef}
              label="Cari halaman"
              placeholder="Cari halaman…"
              value={query}
              onValueChange={setQuery}
            />
            {query ? null : <span className="app-search__key">{shortcut}</span>}
            {results.length ? (
              <ul className="app-search__results">
                {results.map((entry) => (
                  <li key={entry.item.href}>
                    <Link href={entry.item.href} onClick={() => setQuery("")}>
                      <span>{entry.item.label}</span>
                      <span className="app-search__group">{entry.group}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}

        <nav className="app-nav" aria-label="Navigasi utama">
          {navigation.map((group) => (
            <div key={group.title} className="app-nav__group">
              {collapsed ? (
                <span className="app-nav__divider" />
              ) : (
                <span className="app-nav__title">{group.title}</span>
              )}
              {group.items.map((item) => {
                const Icon = ICONS[item.icon] ?? LayoutDashboard;
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

                // The Fixex dashboard item is the role switcher, in the rail too.
                if (item.href === "/fixex") {
                  return (
                    <div
                      key={item.href}
                      className="app-nav__dropdown"
                      data-active={active ? "" : undefined}
                    >
                      <DropdownMenu
                        label={item.label}
                        icon={<Icon size={16} strokeWidth={1.75} />}
                        items={roles.map((option) => ({
                          label: option.label,
                          onSelect: () => {
                            setRole(option.value);
                            router.push("/fixex");
                          },
                        }))}
                      />
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="app-nav__item"
                    data-active={active ? "" : undefined}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={16} strokeWidth={1.75} />
                    {collapsed ? null : <span className="app-nav__label">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="app-sidebar__foot">
          {collapsed ? (
            <Link href="/profile" className="app-icon-button" aria-label="Profil">
              <UserCog size={16} />
            </Link>
          ) : (
            <Link href="/profile" className="app-user">
              <span className="app-user__avatar">SA</span>
              <span className="app-user__text">
                <span className="app-user__name">Super Admin</span>
                <span className="app-user__mail">superadmin@stars.local</span>
              </span>
              <Badge size="sm" pill tone="info">
                super
              </Badge>
            </Link>
          )}
        </div>
      </aside>

      <div className="app-column">
        <header className="app-topbar">
          <div className="app-breadcrumb">
            <Link href="/">S.T.A.R.S</Link>
            {match ? (
              <>
                <span aria-hidden="true">/</span>
                <span>{groupLabel}</span>
                <span aria-hidden="true">/</span>
                {trail.length ? <span>{match.item.label}</span> : <strong>{match.item.label}</strong>}
                {trail.map((segment, index) => (
                  <Fragment key={`${index}-${segment}`}>
                    <span aria-hidden="true">/</span>
                    {index === trail.length - 1 ? <strong>{segment}</strong> : <span>{segment}</span>}
                  </Fragment>
                ))}
              </>
            ) : null}
          </div>

          <div className="app-topbar__actions">
            <DropdownMenu
              label="Buat"
              icon={<Plus size={15} strokeWidth={2} />}
              items={[
                { label: "Perusahaan baru", onSelect: () => router.push("/perusahaan/new") },
                { label: "Wilayah & cabang", onSelect: () => router.push("/perusahaan/regions") },
                { label: "Karyawan baru", separatorBefore: true, onSelect: () => router.push("/human-resources/karyawan/new") },
                { label: "Dokumen baru", onSelect: () => router.push("/komunikasi/dokumen/new") },
              ]}
            />

            <ThemeSwitch theme={theme} onThemeChange={toggleTheme} iconOnly />
            <UserMenu
              user={{ name: "Super Admin", email: "superadmin@stars.local", plan: "WMPL" }}
              showTheme={false}
              items={[
                { label: "Profil & keamanan", onSelect: () => router.push("/profile") },
                { label: "Portal antar perusahaan", onSelect: () => router.push("/portal") },
                { label: "Keluar", onSelect: () => router.push("/profile") },
              ]}
            />
          </div>
        </header>

        <main className="app-main">
          <div className="app-content">{children}</div>
        </main>
      </div>
    </div>
  );
}