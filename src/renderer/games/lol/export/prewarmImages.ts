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
 * own `useEffect` on mount.
 *
 * Resolving every distinct value up front — there are at most 10 mastery
 * levels, 4 banner tiers, and 6 gem rarities, regardless of collection size
 * — means every card's own effect resolves from an already-settled cached
 * promise, so those `<img>` tags are in the DOM before a capture starts
 * scanning for them.
 *
 * This was originally written to fix the "half the cards export blank" bug
 * and did NOT fix it; the real cause was html2canvas's own image cache
 * evicting entries past its 100-entry default (see capture.ts's
 * MAX_IMAGE_CACHE_SIZE). It's kept because it's still the cheapest way to
 * get the lazily-resolved art into the DOM up front rather than letting the
 * capture's settle-loop discover it a frame at a time — but it is not load-
 * bearing for image correctness.
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
