// GameProvider contract, connection state, and other cross-game primitives.

export type GameId = 'lol' | 'tft' | 'valorant';

export type ConnectionState = 'unavailable' | 'connecting' | 'connected' | 'error';

export interface ConnectionStatus {
  state: ConnectionState;
  /** Present only when state is 'error'. */
  error?: string;
}

export type ConnectionListener = (status: ConnectionStatus) => void;

// Data capabilities a provider may declare. The UI renders only what is
// declared present — a missing capability is a normal state, not an error.
export type GameCapability =
  | 'summary'
  | 'ranked'
  | 'champions'
  | 'skins'
  | 'chromas'
  | 'collectibles'
  | 'loot';

export interface GameProvider {
  readonly id: GameId;
  readonly displayName: string;
  readonly capabilities: readonly GameCapability[];

  /** One-shot check for whether a client is currently reachable. Never throws. */
  detect(): Promise<boolean>;

  /** Establish a connection and start watching it for an unexpected shutdown. Never throws. */
  connect(): Promise<void>;

  /** Tear down the connection, if any, and stop watching it. Never throws. */
  disconnect(): Promise<void>;

  getStatus(): ConnectionStatus;

  /** Subscribe to connection status changes. Returns an unsubscribe function. */
  onStatusChange(listener: ConnectionListener): () => void;
}

// User preferences (theme mode, last active game, filters, grid density, ...)
// per the Persistence section of CLAUDE.md — game-agnostic, stored via
// src/main/core/store/preferences.ts.
export interface Preferences {
  gridDensityIndex?: number;
}

// A saved snapshot of "an account as it was displayed" — per CLAUDE.md's
// Persistence section: "account ID plus displayed data only, tagged by
// game." Core only knows the generic shape; the actual `data` payload is a
// per-game type (e.g. LolAccountSnapshotData in shared/types/lol.ts) that
// core never inspects. Split into a lightweight Meta (for cheap list
// rendering) and the full Snapshot (Meta + data, loaded only when a specific
// entry is opened) — see src/main/core/store/snapshots.ts.
export interface AccountSnapshotMeta {
  id: string;
  gameId: GameId;
  /** Per-game account identifier (e.g. "euw1:12345") — NOT used to dedupe; the same account viewed again still gets a new entry. */
  accountKey: string;
  /** Display name for the history list, e.g. the summoner name. */
  label: string;
  /** Secondary display line for the history list, e.g. the region. */
  subtitle: string;
  capturedAt: number;
}

export interface AccountSnapshot<TData = unknown> extends AccountSnapshotMeta {
  data: TData;
}
