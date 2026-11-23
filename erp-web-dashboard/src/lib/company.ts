/**
 * Company records for the Perusahaan screens. Reads go through
 * `GET /master/companies`; when the API is down every screen falls back to the
 * sample tenant so the list, detail and edit views stay reviewable.
 *
 * Brand colours, wilayah and cutoff have no columns in erp-backend-api yet, so
 * a draft keeps them for this session and the views label them as such.
 */
import { apiFetch } from "@/lib/api";

export interface CompanyRow {
  id: string;
  code: string;
  name: string;
  legalName?: string | null;
  defaultTimezone: string;
  isActive?: boolean;
}

export interface CompanyDraft {
  code: string;
  name: string;
  legalName: string;
  timezone: string;
  primary: string;
  secondary: string;
  provinceIds: string[];
  regencyIds: string[];
  /** Day of month the attendance cycle starts, 26 in the PRD. */
  cutoffDay: number;
  /** Data URL held in the session draft until object storage is wired. */
  logo: string;
}

export const defaultDraft: CompanyDraft = {
  code: "",
  name: "",
  legalName: "",
  timezone: "Asia/Jakarta",
  primary: "#1d4ed8",
  secondary: "#0f766e",
  provinceIds: [],
  regencyIds: [],
  cutoffDay: 26,
  logo: "",
};

export const sampleCompanies: CompanyRow[] = [
  {
    id: "wmpl",
    code: "WMPL",
    name: "Wijaya Manggala Premier Lestari",
    legalName: "PT Wijaya Manggala Premier Lestari",
    defaultTimezone: "Asia/Jakarta",
    isActive: true,
  },
  {
    id: "wmpl-logistik",
    code: "WMPL-L",
    name: "WMPL Logistik",
    legalName: "PT Wijaya Manggala Logistik",
    defaultTimezone: "Asia/Makassar",
    isActive: true,
  },
];

/** Drafts are kept per tenant in localStorage, so an uploaded logo survives a reload. */
const drafts = new Map<string, CompanyDraft>();
const draftKey = (companyId: string) => `stars:company-draft:${companyId}`;

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function rememberDraft(companyId: string, draft: CompanyDraft) {
  drafts.set(companyId, draft);
  try {
    storage()?.setItem(draftKey(companyId), JSON.stringify(draft));
  } catch {
    // Private mode or quota full: the draft still lives for this session.
  }
}

/** Merge one field into the draft, so a logo lands before the wizard is finished. */
export function patchDraft(companyId: string, patch: Partial<CompanyDraft>): CompanyDraft {
  const next = { ...(readDraft(companyId) ?? defaultDraft), ...patch };
  rememberDraft(companyId, next);
  return next;
}

export function readDraft(companyId: string): CompanyDraft | undefined {
  const cached = drafts.get(companyId);
  if (cached) return cached;

  let raw: string | null = null;
  try {
    raw = storage()?.getItem(draftKey(companyId)) ?? null;
  } catch {
    raw = null;
  }
  if (!raw) return undefined;

  try {
    const draft = { ...defaultDraft, ...(JSON.parse(raw) as Partial<CompanyDraft>) };
    drafts.set(companyId, draft);
    return draft;
  } catch {
    return undefined;
  }
}

export function draftFrom(row: CompanyRow): CompanyDraft {
  const saved = readDraft(row.id);
  if (saved) return saved;
  return {
    ...defaultDraft,
    code: row.code,
    name: row.name,
    legalName: row.legalName ?? "",
    timezone: row.defaultTimezone,
  };
}

export interface RegionRow {
  id: string;
  companyId: string;
  code: string;
  name: string;
  timezone: string;
}

/** Regions are the stored provinsi of a tenant; a company without rows shows none. */
export async function fetchRegionsByCompany(): Promise<Map<string, RegionRow[]>> {
  try {
    const data = await apiFetch<{ regions?: RegionRow[] }>("/master/regions");
    const grouped = new Map<string, RegionRow[]>();
    for (const region of data.regions ?? []) {
      const list = grouped.get(region.companyId) ?? [];
      list.push(region);
      grouped.set(region.companyId, list);
    }
    return grouped;
  } catch {
    return new Map();
  }
}

export async function fetchCompanies(): Promise<{ rows: CompanyRow[]; fromSample: boolean }> {
  try {
    const data = await apiFetch<{ companies?: CompanyRow[] }>("/master/companies");
    if (data.companies?.length) return { rows: data.companies, fromSample: false };
    return { rows: [], fromSample: false };
  } catch {
    return { rows: sampleCompanies, fromSample: true };
  }
}

/** The tenant the sidebar switcher last selected, else the first row. */
export async function resolveActiveCompany(): Promise<CompanyRow | null> {
  const { rows } = await fetchCompanies();
  const stored = typeof window === "undefined" ? null : window.localStorage.getItem("stars:active-company");
  return rows.find((row) => row.id === stored) ?? rows[0] ?? null;
}

export async function fetchCompany(
  companyId: string
): Promise<{ row: CompanyRow | null; fromSample: boolean }> {
  const { rows, fromSample } = await fetchCompanies();
  return { row: rows.find((row) => row.id === companyId) ?? null, fromSample };
}