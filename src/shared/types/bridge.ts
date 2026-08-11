// Shape of the contextBridge surface exposed to the renderer as `window.oracleLens`.
// Defined once here so preload (implementation) and renderer (consumer) can't drift apart.

import type { ConnectionStatus } from './core';
import type { AccountSummary, ChampionMasteryEntry, RankedSummary } from './lol';

export interface LolBridge {
  getConnectionStatus(): Promise<ConnectionStatus>;
  onConnectionStatusChange(listener: (status: ConnectionStatus) => void): () => void;
  getAccountSummary(): Promise<AccountSummary>;
  getRankedSummary(): Promise<RankedSummary>;
  getChampionMasteries(): Promise<ChampionMasteryEntry[]>;
  getMasteryCrestUrl(level: number): Promise<string | null>;
}

export interface OracleLensBridge {
  lol: LolBridge;
}
