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
  | 'valueScore';

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
