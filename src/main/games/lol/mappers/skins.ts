import {
  isPriceableAvailability,
  skinRarityRank,
  type OwnedSkin,
} from '../../../../shared/types/lol';
import type { LcuSkinMinimal } from '../endpoints/skins';
import { baseSkinId, getChampionMeta, getSkinMeta, getSkinTileDataUrl } from '../../../core/cdn/lol';
import { resolveSkinAvailability } from '../data/skinAvailability';
import { estimatedRpForRarity } from '../data/rarityRpPrices';

export async function mapOwnedSkins(
  raw: LcuSkinMinimal[],
  rpPrices: Map<number, number>,
): Promise<OwnedSkin[]> {
  // Base skins are every champion's default look, not a collectible — the
  // client owns one for every champion, so they'd swamp the real skins.
  const owned = raw.filter((skin) => skin.ownership.owned && !skin.isBase);

  const skins = await Promise.all(
    owned.map(async (skin): Promise<OwnedSkin> => {
      // Community Dragon has no direct entry for rotated-out special-mode
      // (6000xxxx) skins — getSkinMeta falls back to the normal skin's data.
      const [meta, tileDataUrl, championMeta] = await Promise.all([
        getSkinMeta(skin.id),
        getSkinTileDataUrl(skin.id),
        getChampionMeta(skin.championId),
      ]);

      const rarity = meta?.rarity ?? 'standard';
      const isLegacy = meta?.isLegacy ?? false;
      const isSpecialMode = championMeta?.isSpecialMode ?? false;

      // Special-mode ids shadow a normal skin, so classify them off the skin
      // they shadow — otherwise a "LoL Classic" copy of a Victorious skin
      // would be labelled purchasable.
      const availability = resolveSkinAvailability(baseSkinId(skin.id), rarity, isLegacy);

      // Only ever price what was actually sold for RP. Rewards, craftables,
      // promos and retired exclusives stay unpriced no matter what the store
      // happens to return, and special-mode copies are granted off a skin the
      // account already owns — pricing them would bill the same skin twice.
      const priceable = isPriceableAvailability(availability) && !isSpecialMode;
      const rpCost = priceable ? (rpPrices.get(skin.id) ?? null) : null;

      return {
        skinId: skin.id,
        championId: skin.championId,
        championName: championMeta?.name ?? `Champion ${skin.championId}`,
        name: skin.name,
        rarity,
        isLegacy,
        owned: skin.ownership.owned,
        tileDataUrl,
        isSpecialMode,
        availability,
        rpCost,
        estimatedRpCost: rpCost === null && priceable ? estimatedRpForRarity(rarity) : null,
      };
    }),
  );

  return skins.sort((a, b) => {
    const byRarity = skinRarityRank(a.rarity) - skinRarityRank(b.rarity);
    return byRarity !== 0 ? byRarity : a.name.localeCompare(b.name);
  });
}
