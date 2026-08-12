// League of Legends domain types, mapped from LCU payloads at the provider boundary.

export interface AccountSummary {
  summonerName: string;
  accountLevel: number;
  region: string;
  profileIconId: number;
  honorLevel: number;
}

// Unranked and provisional (placement games) are normal, distinct states —
// not errors and not a "ranked with zero stats" fallback.
export type RankedQueueStatus =
  | { kind: 'unranked' }
  | { kind: 'provisional'; gamesPlayed: number }
  | {
      kind: 'ranked';
      tier: string;
      division: string;
      leaguePoints: number;
      wins: number;
      losses: number;
      /** 0-100, rounded */
      winRate: number;
    };

export interface RankedSummary {
  soloDuo: RankedQueueStatus;
  flex: RankedQueueStatus;
}

export interface ChampionMasteryEntry {
  championId: number;
  championName: string;
  masteryLevel: number;
  masteryPoints: number;
  /** null when the CDN icon couldn't be fetched — render a placeholder. */
  iconDataUrl: string | null;
  /**
   * Rotating special-mode/event content (championId >= 60000, e.g. the
   * now-retired "LoL Classic" roster) rather than a normal roster champion —
   * shown in its own "Other" section since Riot's static catalogs stop
   * listing it once the event ends.
   */
  isSpecialMode: boolean;
}

// Real rarity tiers, verified against Community Dragon's static skin data.
// "standard" covers both kNoRarity and kRare — neither has a distinct gem
// icon in the actual client. Note: "Hextech" is a skin theme (skinLine), not
// a rarity tier — Hextech-themed skins are usually 'mythic', sometimes
// 'standard'.
export type SkinRarity =
  | 'standard'
  | 'rare'
  | 'epic'
  | 'mythic'
  | 'legendary'
  | 'ultimate'
  | 'transcendent'
  | 'exalted';

/** Rarest first. Drives the default skin ordering and the filter dropdown. */
export const SKIN_RARITY_ORDER: readonly SkinRarity[] = [
  'exalted',
  'transcendent',
  'ultimate',
  'mythic',
  'legendary',
  'epic',
  'rare',
  'standard',
];

export function skinRarityRank(rarity: SkinRarity): number {
  return SKIN_RARITY_ORDER.indexOf(rarity);
}

export interface OwnedSkin {
  skinId: number;
  championId: number;
  /** Kept for future search/grouping even though the card renders only `name`. */
  championName: string;
  name: string;
  rarity: SkinRarity;
  isLegacy: boolean;
  owned: boolean;
  /** null when the CDN tile image couldn't be fetched — render a placeholder. */
  tileDataUrl: string | null;
  /** Rotating special-mode/event content — see ChampionMasteryEntry.isSpecialMode. */
  isSpecialMode: boolean;
}

export interface OwnedChroma {
  chromaId: number;
  name: string;
  /** Hex colour strings straight from the LCU, e.g. "#FFC948". */
  colors: string[];
  /** null when the CDN image couldn't be fetched — render the color swatch alone. */
  imageDataUrl: string | null;
}

export interface SkinChromaGroup {
  skinId: number;
  skinName: string;
  chromas: OwnedChroma[];
}

export interface OwnedWardSkin {
  wardId: number;
  name: string;
  /** null when the CDN image couldn't be fetched — render a placeholder. */
  imageDataUrl: string | null;
}

export interface OwnedEmote {
  emoteId: number;
  name: string;
  /** null when the CDN image couldn't be fetched — render a placeholder. */
  imageDataUrl: string | null;
}

export interface OwnedProfileIcon {
  iconId: number;
  /** null when the CDN image couldn't be fetched — render a placeholder. */
  imageDataUrl: string | null;
}
