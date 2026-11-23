/**
 * Live cursors for one letter. A review session is short and this API runs as a
 * single process, so an in-memory room per document is enough; peers that stop
 * polling are dropped after a few seconds.
 */
export interface PresenceCaret {
  /** Percent of the paper width. */
  x: number;
  /** Percent of the paper height. */
  y: number;
}

export interface PresencePeer {
  userId: string;
  name: string;
  color: string;
  caret: PresenceCaret | null;
  at: number;
}

const TTL_MS = 15_000;
const COLORS = ["#2563eb", "#db2777", "#059669", "#d97706", "#7c3aed", "#0891b2"];
const rooms = new Map<string, Map<string, PresencePeer>>();

/** Stable colour per account, so a cursor keeps its identity across reloads. */
function colorFor(userId: string) {
  let hash = 0;
  for (const char of userId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length]!;
}

export function touchPresence(
  documentId: string,
  userId: string,
  name: string,
  caret: PresenceCaret | null
): PresencePeer {
  const room = rooms.get(documentId) ?? new Map<string, PresencePeer>();
  const peer: PresencePeer = { userId, name, color: colorFor(userId), caret, at: Date.now() };
  room.set(userId, peer);
  rooms.set(documentId, room);
  return peer;
}

/** Everyone else currently on the letter. */
export function listPeers(documentId: string, selfId: string): PresencePeer[] {
  const room = rooms.get(documentId);
  if (!room) return [];

  const now = Date.now();
  const alive: PresencePeer[] = [];
  for (const [id, peer] of room) {
    if (now - peer.at > TTL_MS) {
      room.delete(id);
      continue;
    }
    if (id !== selfId) alive.push({ ...peer, at: peer.at });
  }
  return alive;
}