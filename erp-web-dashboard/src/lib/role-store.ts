"use client";

import { useSyncExternalStore } from "react";
import { roleByValue } from "@/lib/roles";
import type { RoleValue } from "@/lib/roles";

/**
 * The sidebar owns the role switch, the dashboard reads it. One module-level
 * store keeps both in sync without a provider, and the choice survives a reload
 * through localStorage. It is a preview of the layout; the real role still comes
 * from the session token.
 */
const KEY = "stars:role";
const listeners = new Set<() => void>();

let current: RoleValue = "super_admin";

function emit() {
  for (const listener of listeners) listener();
}

export function setRole(value: RoleValue) {
  current = value;
  try {
    window.localStorage.setItem(KEY, value);
  } catch {
    // Private mode: the choice still holds for this session.
  }
  emit();
}

/** Called once by the shell after mount, so the first paint stays server-safe. */
export function hydrateRole() {
  try {
    const stored = window.localStorage.getItem(KEY);
    if (!stored) return;
    const next = roleByValue(stored).value;
    if (next === current) return;
    current = next;
    emit();
  } catch {
    // No storage access: keep the default.
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useRole(): RoleValue {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => "super_admin" as RoleValue
  );
}