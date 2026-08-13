// League of Legends domain types, mapped from LCU payloads at the provider boundary.

export interface AccountSummary {
  /** The LCU's own numeric summoner ID — region-scoped, stable across name changes. Used to key snapshot history. */
  accountId: number;
  summonerName: string;
  accountLevel: number;
  region: string;
  profileIconId: number;
  honorLevel: number;
  /** ISO 3166-1 alpha-3 country code the account was opened in, e.g. "TUR". Absent if the LCU didn't provide it. */
  country?: string;
  /** Riot's own season number (see /lol-seasons), e.g. 15. Absent if the account's creation date or season boundaries weren't available. */
  createdSeasonId?: number;
}

export interface Wallet {
  riotPoints: number;
  blueEssence: number;
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

// Loot is the player's UNCLAIMED inventory (shards, chests, keys, crafting
// materials) — entirely separate from the "owned" collections above. An item
// showing up here says nothing about whether the underlying champion/skin/
// ward/emote is owned; owned-collection counts must never include it.
//
// Categories mirror the real client's own grouping (verified against
// Community Dragon's rcp-fe-lol-loot translation strings and a live
// account's /lol-loot/v1/player-loot response), with the client's single
// "Materials" bucket (CHEST display category) split in two per the user's
// request: real chests/keys vs. Mythic Essence (Gemstone is fully retired
// game content as of this writing but is grouped the same way if it's ever
// seen on an older account).
export type LootCategory =
  | 'championShards'
  | 'skinShards'
  | 'wardsAndEmotes'
  | 'chestsKeysOrbs'
  | 'materials'
  | 'other';

/** Rarest-to-broadest is meaningless here; this is just the fixed display order. */
export const LOOT_CATEGORY_ORDER: readonly LootCategory[] = [
  'championShards',
  'skinShards',
  'wardsAndEmotes',
  'chestsKeysOrbs',
  'materials',
  'other',
];

export interface LootCurrencyAmount {
  amount: number;
  /** Human label resolved from the LCU's own currency lootName, e.g. "Orange Essence". */
  label: string;
}

export interface LootItem {
  /** The LCU's own stable identifier, e.g. "CHAMPION_SKIN_RENTAL_164002" — used as the React key. */
  lootName: string;
  name: string;
  category: LootCategory;
  count: number;
  /** null when the CDN tile image couldn't be fetched — render a placeholder. */
  imageDataUrl: string | null;
  /** Absent when disenchanting yields nothing (e.g. chests, currencies). */
  disenchantValue?: LootCurrencyAmount;
  /** Absent when there's no direct unlock cost (e.g. already permanent, or not craftable). */
  unlockCost?: LootCurrencyAmount;
}

// Everything the LoL workspace has on screen at once — the `data` payload
// for a history snapshot (see AccountSnapshot in shared/types/core.ts).
// Saved verbatim as already-fetched, already-image-resolved domain objects
// (imageDataUrl fields and all), so a saved snapshot renders fully offline
// with zero re-fetching or re-resolution logic — see App.tsx.
export interface LolAccountSnapshotData {
  summary: AccountSummary;
  ranked: RankedSummary;
  wallet: Wallet;
  champions: ChampionMasteryEntry[];
  skins: OwnedSkin[];
  chromas: SkinChromaGroup[];
  wardSkins: OwnedWardSkin[];
  emotes: OwnedEmote[];
  profileIcons: OwnedProfileIcon[];
  loot: LootItem[];
}
