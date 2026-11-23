"use client";

import type { DocumentPeer } from "@/lib/documents";

interface PresenceCursorsProps {
  peers: DocumentPeer[];
  self?: { name: string; color: string; caret: { x: number; y: number } | null };
}

/** Draws the pointer of everyone on the letter over the paper. */
export function PresenceCursors({ peers, self }: PresenceCursorsProps) {
  const markers: { id: string; name: string; color: string; caret: { x: number; y: number } }[] = [];

  if (self?.caret) {
    markers.push({ id: "self", name: `${self.name} (kamu)`, color: self.color, caret: self.caret });
  }
  for (const peer of peers) {
    if (peer.caret) markers.push({ id: peer.userId, name: peer.name, color: peer.color, caret: peer.caret });
  }

  return (
    <div className="doc-presence" aria-hidden="true">
      {markers.map((marker) => (
        <span
          key={marker.id}
          className="doc-cursor"
          style={{ left: `${marker.caret.x}%`, top: `${marker.caret.y}%`, borderLeftColor: marker.color }}
        >
          <span className="doc-cursor__label" style={{ background: marker.color }}>
            {marker.name}
          </span>
        </span>
      ))}
    </div>
  );
}