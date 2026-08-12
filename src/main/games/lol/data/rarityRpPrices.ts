import type { SkinRarity } from '../../../../shared/types/lol';

/**
 * Standard RP price per rarity tier, used ONLY to estimate skins the store
 * catalog no longer prices — vaulted legacy content, mostly.
 *
 * These numbers are not recalled from memory: they were read off the live
 * catalog, where the price for a tier is overwhelmingly consistent (824 of 825
 * priced epics are 1350, 111 of 113 legendaries are 1820, 6 of 7 ultimates are
 * 3250). An estimate derived this way is still an estimate — the UI must keep
 * it out of the exact total.
 *
 * The remaining tiers are deliberately absent because they have no single
 * price to fall back on:
 * - standard/rare span 390/520/750/975 with nothing in the data saying which
 *   applies to a given skin
 * - mythic/transcendent/exalted are not sold for RP at all
 */
const RARITY_RP_PRICES: Partial<Record<SkinRarity, number>> = {
  epic: 1350,
  legendary: 1820,
  ultimate: 3250,
};

export function estimatedRpForRarity(rarity: SkinRarity): number | null {
  return RARITY_RP_PRICES[rarity] ?? null;
}
