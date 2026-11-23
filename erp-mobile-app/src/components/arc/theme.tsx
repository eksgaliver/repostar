/**
 * Arc UI theme for React Native.
 *
 * The vendored registry is React DOM + CSS modules, so it cannot run on a
 * device. `tokens.ts` is the generated hex mirror of `foundation.css`; this
 * file turns it into a context so every port reads the same values the web
 * dashboard does, in light and dark.
 */
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { arcTokens } from "./tokens";
import type { ArcTheme, ArcTokenSet } from "./tokens";

export * from "./tokens";
export type { ArcTheme, ArcTokenSet };

interface ArcThemeContextValue {
  theme: ArcTheme;
  tokens: ArcTokenSet;
  setTheme: (theme: ArcTheme) => void;
  toggle: () => void;
}

const ArcThemeContext = createContext<ArcThemeContextValue | null>(null);

export function ArcProvider({ children, initial = "light" }: { children: ReactNode; initial?: ArcTheme }) {
  const [theme, setTheme] = useState<ArcTheme>(initial);

  const toggle = useCallback(() => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }, []);

  const value = useMemo<ArcThemeContextValue>(
    () => ({ theme, tokens: arcTokens[theme] as ArcTokenSet, setTheme, toggle }),
    [theme, toggle],
  );

  return <ArcThemeContext.Provider value={value}>{children}</ArcThemeContext.Provider>;
}

export function useArcTheme(): ArcThemeContextValue {
  const value = useContext(ArcThemeContext);
  if (!value) throw new Error("useArcTheme must be used inside <ArcProvider>");
  return value;
}

export function useTokens(): ArcTokenSet {
  return useArcTheme().tokens;
}

/** `1rem` in the stylesheet is 16px on device; tokens keep the string form. */
export function rem(value: string | number): number {
  if (typeof value === "number") return value;
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric * 16 : 16;
}

export function space(token: ArcTokenSet, key: "space1" | "space2" | "space3" | "space4" | "space6" | "space8"): number {
  return rem(token[key]);
}

export function radius(token: ArcTokenSet, key: "radiusControl" | "radiusPanel" | "radiusSurface" | "radiusPill"): number {
  return rem(token[key]);
}

/** Semantic tone -> token colour. */
export function toneColor(token: ArcTokenSet, tone: Tone): string {
  switch (tone) {
    case "success":
      return token.toneGreen;
    case "danger":
      return token.danger;
    case "warning":
      return token.warning;
    case "info":
      return token.info;
    case "violet":
      return token.toneViolet;
    case "orchid":
      return token.toneOrchid;
    case "rose":
      return token.toneRose;
    default:
      return token.textSecondary;
  }
}

export type Tone = "neutral" | "success" | "danger" | "warning" | "info" | "violet" | "orchid" | "rose";