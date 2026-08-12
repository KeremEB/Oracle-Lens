import {
  isPriceableAvailability,
  type OwnedSkin,
  type SkinAvailability,
} from '../../../shared/types/lol';

/**
 * Account value is reported as RP actually spent, never as an invented score.
 * Prices come from the LCU's own store catalog; nothing here derives a price
 * from rarity. The one exception is `estimatedRp`, which the provider fills in
 * from a rarity's standard price for vaulted content the store stopped
 * pricing — it is kept in its own bucket and never folded into `exactRp`.
 *
 * Three buckets, in descending order of how much we trust them:
 *   exactRp     — priced by the client right now
 *   estimatedRp — priceable, but only via its rarity's standard price
 *   unpriced    — priceable in principle, no price and no usable rarity
 * Skins that were never sold for RP (rewards, promos, craftables, retired
 * exclusives) are counted but never priced.
 *
 * "LoL Classic" special-mode copies sit outside all of it. They are granted
 * off a skin the account already owns, so counting them would bill the same
 * purchase twice — they get their own count so the exclusion stays visible.
 */
export interface RpValueBreakdown {
  exactRp: number;
  exactCount: number;
  estimatedRp: number;
  estimatedCount: number;
  /** Priceable skins with neither a store price nor an estimable rarity. */
  unpricedCount: number;
  countsByAvailability: Record<SkinAvailability, number>;
  specialModeCount: number;
  /** Excludes special-mode copies — the number the buckets actually add up to. */
  totalSkins: number;
}

const EMPTY_COUNTS: Record<SkinAvailability, number> = {
  purchasable: 0,
  legacy: 0,
  reward: 0,
  craftable: 0,
  promotional: 0,
  unavailable: 0,
};

export function computeRpValue(skins: OwnedSkin[]): RpValueBreakdown {
  const breakdown: RpValueBreakdown = {
    exactRp: 0,
    exactCount: 0,
    estimatedRp: 0,
    estimatedCount: 0,
    unpricedCount: 0,
    countsByAvailability: { ...EMPTY_COUNTS },
    specialModeCount: 0,
    totalSkins: 0,
  };

  for (const skin of skins) {
    if (skin.isSpecialMode) {
      breakdown.specialModeCount += 1;
      continue;
    }

    breakdown.totalSkins += 1;
    breakdown.countsByAvailability[skin.availability] += 1;

    if (skin.rpCost !== null) {
      breakdown.exactRp += skin.rpCost;
      breakdown.exactCount += 1;
    } else if (skin.estimatedRpCost !== null) {
      breakdown.estimatedRp += skin.estimatedRpCost;
      breakdown.estimatedCount += 1;
    } else if (isPriceableAvailability(skin.availability)) {
      breakdown.unpricedCount += 1;
    }
  }

  return breakdown;
}

/** Availability tiers that are reported as a bare count, never priced. */
export const UNPRICED_AVAILABILITIES: readonly SkinAvailability[] = [
  'reward',
  'craftable',
  'promotional',
  'unavailable',
];
