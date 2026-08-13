import type { ChampionMasteryEntry, OwnedSkin } from '../../../../shared/types/lol';
import { getMasteryCrestDataUrl } from '../masteryCrestCache';
import { getMasteryBannerDataUrl } from '../masteryBannerCache';
import { getRarityGemDataUrl } from '../rarityGemCache';

/**
 * Most cards' art arrives already resolved as part of the domain data
 * (portraits, tiles, ward/emote/loot icons) — nothing to wait on beyond the
 * `<img>` tag itself decoding. Two card types are different: ChampionCard's
 * mastery crest/banner and SkinCard's rarity gem resolve lazily, one IPC
 * round trip per DISTINCT value (level or rarity), fired from each card's
 * own `useEffect` on mount. With 100+ cards mounting at once, that's 100+
 * effects racing to populate a handful of shared caches — capturing before
 * they've all settled is what left more than half of a large Champions
 * export with no crest/banner (or, if the whole capture ran ahead of React
 * even finishing those re-renders, no portrait either).
 *
 * Resolving every distinct value up front — there are at most 10 mastery
 * levels, 4 banner tiers, and 6 gem rarities, regardless of collection size
 * — means every card's own effect resolves from an already-settled cached
 * promise instead of racing a fresh round trip, which is what actually
 * closes the gap rather than just waiting longer for it.
 */
export async function prewarmCardImageCaches(
  champions: ChampionMasteryEntry[],
  skins: OwnedSkin[],
): Promise<void> {
  const levels = [...new Set(champions.map((c) => c.masteryLevel))];
  const rarities = [...new Set(skins.map((s) => s.rarity))];

  await Promise.all([
    ...levels.map((level) => getMasteryCrestDataUrl(level)),
    ...levels.map((level) => getMasteryBannerDataUrl(level)),
    ...rarities.map((rarity) => getRarityGemDataUrl(rarity)),
  ]);
}
