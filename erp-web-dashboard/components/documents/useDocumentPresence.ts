"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, RefObject } from "react";
import { sendPresence } from "@/lib/documents";
import type { DocumentPeer } from "@/lib/documents";

const clamp = (value: number) => Math.min(Math.max(value, 0), 100);

/**
 * Polls the presence room once a second and reports where this caret is, in
 * percentages of the paper. A text selection wins; the pointer is the fallback,
 * so a reader without a caret still shows up as the second cursor.
 */
export function useDocumentPresence(
  documentId: string,
  paperRef: RefObject<HTMLElement | null>,
  name: string
) {
  const [peers, setPeers] = useState<DocumentPeer[]>([]);
  const [color, setColor] = useState("#2563eb");
  const [caret, setCaret] = useState<{ x: number; y: number } | null>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);

  function caretPercent() {
    const paper = paperRef.current;
    if (!paper) return null;

    const base = paper.getBoundingClientRect();
    const selection = document.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0).cloneRange();
      range.collapse(false);
      const rect = range.getBoundingClientRect();
      if ((rect.width || rect.height) && rect.top >= base.top - 40 && rect.top <= base.bottom + 40) {
        return {
          x: clamp(((rect.left - base.left) / base.width) * 100),
          y: clamp(((rect.top - base.top) / base.height) * 100),
        };
      }
    }

    return pointer.current;
  }

  function trackPointer(event: ReactMouseEvent<HTMLElement>) {
    const paper = paperRef.current;
    if (!paper) return;
    const base = paper.getBoundingClientRect();
    pointer.current = {
      x: clamp(((event.clientX - base.left) / base.width) * 100),
      y: clamp(((event.clientY - base.top) / base.height) * 100),
    };
  }

  useEffect(() => {
    let active = true;
    const tick = async () => {
      const next = caretPercent();
      try {
        const data = await sendPresence(documentId, { name, caret: next });
        if (!active) return;
        setPeers(data.peers);
        setColor(data.color);
        setCaret(next);
      } catch {
        // Offline: keep the last known room.
      }
    };
    void tick();
    const timer = window.setInterval(tick, 1000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, name]);

  return { peers, color, caret, trackPointer };
}