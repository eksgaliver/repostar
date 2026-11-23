/**
 * Arc UI · React Native ports for S.T.A.R.S.
 *
 * The web dashboard vendors the whole uiarc.dev registry (React DOM + CSS
 * modules). Those files cannot run on a device, so this folder re-implements
 * the same components on top of React Native primitives, reading the same
 * generated tokens (`tokens.ts` -> `theme.tsx`).
 *
 * Import from the barrel, never from a file directly:
 *   import { ArcProvider, Button, DataTable } from "@/components/arc";
 */
export * from "./theme";
export * from "./foundation";
export * from "./display";
export * from "./controls";
export * from "./inputs";
export * from "./overlays";
export * from "./data";
export * from "./charts";
export * from "./extra";
export * from "./registry";