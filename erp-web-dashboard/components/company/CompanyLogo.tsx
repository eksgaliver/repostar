/**
 * Tenant logo, drawn without a container: just the image itself, or the
 * company initials in display type when nothing is uploaded. No circle, no
 * card, no background plate, so the mark reads as the brand rather than an
 * avatar or a thumbnail.
 */
export interface CompanyLogoProps {
  name: string;
  /** Data URL from the session draft. */
  src?: string;
  /** Rendered box in pixels; the image keeps its own aspect ratio inside it. */
  size?: number;
  /** Larger, softer shadow for the detail hero. */
  hero?: boolean;
}

export function CompanyLogo({ name, src, size = 64, hero = false }: CompanyLogoProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`Logo ${name}`}
        width={size}
        height={size}
        className={hero ? "brand-logo brand-logo--hero" : "brand-logo"}
        style={{ width: size, height: size }}
      />
    );
  }

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span
      className="brand-logo brand-logo--monogram"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}