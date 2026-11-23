"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

/**
 * The breadcrumb shows "Group / Item" from the static nav map. A record page
 * needs one more crumb (the company it opened), so pages push their own
 * trailing segments here and the shell renders them after the nav entry.
 */
let trail: string[] = [];
const emptyTrail: string[] = [];
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit() {
  for (const listener of listeners) listener();
}

/** Declare the trailing crumbs for the page that is mounted. */
export function useBreadcrumbTrail(next: string[]) {
  const ref = useRef(next);
  ref.current = next;
  const key = next.join("\u0000");

  useEffect(() => {
    trail = ref.current;
    emit();
    return () => {
      trail = emptyTrail;
      emit();
    };
  }, [key]);
}

export function useBreadcrumbSegments(): string[] {
  return useSyncExternalStore(
    subscribe,
    () => trail,
    () => emptyTrail
  );
}