// Shape of the contextBridge surface exposed to the renderer as `window.oracleLens`.
// Defined once here so preload (implementation) and renderer (consumer) can't drift apart.

import type { ConnectionStatus, Preferences } from './core';
import type { SaveExportRequest, SaveExportResult } from './export';
import type {
  AccountSummary,
  ChampionMasteryEntry,
  LootItem,
  OwnedEmote,
  OwnedProfileIcon,
  OwnedSkin,
  OwnedWardSkin,
  RankedSummary,
  SkinChromaGroup,
  SkinRarity,
  Wallet,
} from './lol';

export interface CoreBridge {
  getPreferences(): Promise<Preferences>;
  setPreference<K extends keyof Preferences>(key: K, value: Preferences[K]): Promise<void>;
  saveExportFile(request: SaveExportRequest): Promise<SaveExportResult>;
}

export interface LolBridge {
  getConnectionStatus(): Promise<ConnectionStatus>;
  onConnectionStatusChange(listener: (status: ConnectionStatus) => void): () => void;
  getAccountSummary(): Promise<AccountSummary>;
  getRankedSummary(): Promise<RankedSummary>;
  getChampionMasteries(): Promise<ChampionMasteryEntry[]>;
  getMasteryCrestUrl(level: number): Promise<string | null>;
  getOwnedSkins(): Promise<OwnedSkin[]>;
  getRarityGemUrl(rarity: SkinRarity): Promise<string | null>;
  getOwnedChromas(): Promise<SkinChromaGroup[]>;
  getOwnedWardSkins(): Promise<OwnedWardSkin[]>;
  getOwnedEmotes(): Promise<OwnedEmote[]>;
  getOwnedProfileIcons(): Promise<OwnedProfileIcon[]>;
  getProfileIconUrl(iconId: number): Promise<string | null>;
  getLevelBorderUrl(accountLevel: number): Promise<string | null>;
  getWallet(): Promise<Wallet>;
  getRankedEmblemUrl(tier: string): Promise<string | null>;
  getRiotPointsIconUrl(): Promise<string | null>;
  getBlueEssenceIconUrl(): Promise<string | null>;
  getMasteryBannerUrl(level: number): Promise<string | null>;
  getHonorBadgeUrl(level: number): Promise<string | null>;
  getPlayerLoot(): Promise<LootItem[]>;
}

export interface OracleLensBridge {
  core: CoreBridge;
  lol: LolBridge;
}
