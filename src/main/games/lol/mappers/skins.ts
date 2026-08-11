import { skinRarityRank, type OwnedSkin } from '../../../../shared/types/lol';
import type { LcuSkinMinimal } from '../endpoints/skins';
import { getChampionMeta, getSkinMeta, getSkinTileDataUrl } from '../../../core/cdn/lol';

export async function mapOwnedSkins(raw: LcuSkinMinimal[]): Promise<OwnedSkin[]> {
  // Base skins are every champion's default look, not a collectible — the
  // client owns one for every champion, so they'd swamp the real skins.
  const owned = raw.filter((skin) => skin.ownership.owned && !skin.isBase);

  const skins = await Promise.all(
    owned.map(async (skin): Promise<OwnedSkin> => {
      // Community Dragon has no entry for "LoL Classic" (6000xxxx) skins, so
      // those fall back to standard rarity and a placeholder tile.
      const [meta, tileDataUrl, championMeta] = await Promise.all([
        getSkinMeta(skin.id),
        getSkinTileDataUrl(skin.id),
        getChampionMeta(skin.championId),
      ]);

      return {
        skinId: skin.id,
        championId: skin.championId,
        championName: championMeta?.name ?? `Champion ${skin.championId}`,
        name: skin.name,
        rarity: meta?.rarity ?? 'standard',
        isLegacy: meta?.isLegacy ?? false,
        owned: skin.ownership.owned,
        tileDataUrl,
        isClassicVariant: championMeta?.isClassicVariant ?? false,
      };
    }),
  );

  return skins.sort((a, b) => {
    const byRarity = skinRarityRank(a.rarity) - skinRarityRank(b.rarity);
    return byRarity !== 0 ? byRarity : a.name.localeCompare(b.name);
  });
}
