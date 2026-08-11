import type { SkinRarity } from '../../../shared/types/lol';

// Only 6 rarities have a gem image (standard/rare don't), and every skin of
// the same rarity shares one — memoize per rarity rather than per skin.
const cache = new Map<SkinRarity, Promise<string | null>>();

export function getRarityGemDataUrl(rarity: SkinRarity): Promise<string | null> {
  let promise = cache.get(rarity);
  if (!promise) {
    promise = window.oracleLens.lol.getRarityGemUrl(rarity);
    cache.set(rarity, promise);
  }
  return promise;
}
