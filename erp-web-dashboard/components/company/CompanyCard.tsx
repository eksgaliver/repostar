"use client";

import Link from "next/link";
import { CompanyLogo } from "@/components/company/CompanyLogo";
import type { CompanyRow } from "@/lib/company";

export interface CompanyCardProps {
  company: CompanyRow;
  /** Data URL from the session draft; the tile falls back to the monogram. */
  logo?: string;
  /** Saved brand colours become the tile gradient; without them a tone pair is picked. */
  colors?: { primary: string; secondary: string };
}

/** Fixed pairs from the Arc tone tokens, so an un-themed tenant still gets a composed card. */
const TONE_PAIRS = [
  ["var(--tone-sky)", "var(--tone-violet)"],
  ["var(--tone-teal)", "var(--tone-sky)"],
  ["var(--tone-rose)", "var(--tone-amber)"],
  ["var(--tone-violet)", "var(--tone-orchid)"],
  ["var(--tone-green)", "var(--tone-teal)"],
  ["var(--tone-amber)", "var(--tone-rose)"],
  ["var(--tone-orchid)", "var(--tone-sky)"],
  ["var(--tone-teal)", "var(--tone-green)"],
];

function toneGradient(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) hash = (hash + seed.charCodeAt(index) * (index + 7)) % 997;
  const [from, to] = TONE_PAIRS[hash % TONE_PAIRS.length]!;
  return `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;
}

/** The tile carries the mark and the short name only; everything else lives on the detail page. */
export function CompanyCard({ company, logo, colors }: CompanyCardProps) {
  const gradient = colors
    ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
    : toneGradient(company.name);

  return (
    <Link href={`/perusahaan/${company.id}`} className="brand-tile" style={{ backgroundImage: gradient }} aria-label={company.name}>
      <span className="brand-tile__logo">
        <CompanyLogo name={company.name} src={logo} size={84} />
      </span>
      <h3 className="brand-tile__name">{company.name}</h3>
    </Link>
  );
}