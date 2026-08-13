import { createHttp1Request, type Credentials } from 'league-connect';

// Shape of GET /lol-loot/v1/player-loot. Undocumented LCU endpoint — path and
// full field list verified against dysolix/hasagi-types' swagger.json
// (LolLootPlayerLoot schema), then cross-checked live against a real
// account's response. Only the fields the mapper actually reads are declared
// here; the real payload has more (redeemableStatus, rarity, tags, ...).
//
// Real accounts sometimes include one entry with every field blank/zero —
// no lootName, no type — which the mapper drops (see loot.ts's classify()).
export interface LcuLootItem {
  lootName: string;
  type: string;
  /** The real client's own grouping key, e.g. "SKIN", "WARDSKIN", "CHEST" — see mappers/loot.ts. */
  displayCategories: string;
  /** Verified live: "EPIC"/"LEGENDARY"/etc. for skins, "DEFAULT" for everything without a real rarity — see mappers/loot.ts's parseLootRarity. */
  rarity: string;
  count: number;
  /** Populated for real content; blank for currencies/chests, which don't disenchant into anything. */
  localizedName: string;
  /**
   * Verified live: populated with the item's real display name (not a raw
   * codename) for skins/wards/icons even when localizedName is blank — the
   * mapper falls back to this.
   */
  itemDesc: string;
  /** "/lol-game-data/assets/..." or "/fe/lol-loot/assets/..." — see cdn/lol.ts's resolveLootAssetUrl. */
  tilePath: string;
  disenchantValue: number;
  /** The lootName of the currency disenchanting yields, e.g. "CURRENCY_cosmetic" — blank if not disenchantable. */
  disenchantLootName: string;
  upgradeEssenceValue: number;
  /** The lootName of the currency an instant unlock costs — blank if the item can't be crafted/unlocked directly. */
  upgradeEssenceName: string;
}

export async function getPlayerLoot(credentials: Credentials): Promise<LcuLootItem[]> {
  const response = await createHttp1Request(
    { url: '/lol-loot/v1/player-loot', method: 'GET' },
    credentials,
  );

  if (!response.ok) {
    throw new Error(`player-loot request failed with status ${response.status}`);
  }

  return response.json<LcuLootItem[]>();
}
