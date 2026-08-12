import type { AccountSummary, OwnedSkin, RankedSummary, RankedQueueStatus } from '../../../shared/types/lol';

// Every weight below is a rough, illustrative estimate — there is no
// authoritative "account value" formula, and this is explicitly a guess
// (see CLAUDE.md's roadmap note for this feature). All tunable numbers live
// in this one module so adjusting the estimate never means hunting through
// UI components.

const POINTS_PER_SKIN = 2;

// Same tiers as SKIN_RARITY_ORDER (shared/types/lol.ts), as point values
// instead of just a sort rank. "Other" (rotating special-mode) skins are
// excluded entirely — they're temporary event content, not real ownership.
const RARITY_POINTS: Record<OwnedSkin['rarity'], number> = {
  standard: 1,
  rare: 2,
  epic: 5,
  mythic: 8,
  legendary: 12,
  ultimate: 20,
  transcendent: 35,
  exalted: 50,
};

// LCU tier strings are uppercase (e.g. "PLATINUM"). Unranked/provisional
// contribute 0.
const TIER_POINTS: Record<string, number> = {
  IRON: 1,
  BRONZE: 2,
  SILVER: 3,
  GOLD: 5,
  PLATINUM: 8,
  EMERALD: 12,
  DIAMOND: 18,
  MASTER: 30,
  GRANDMASTER: 45,
  CHALLENGER: 60,
};

// Rough relative regional market multipliers — not sourced from anywhere
// authoritative, purely illustrative. Unlisted regions default to 1.
const REGION_MULTIPLIERS: Record<string, number> = {
  KR: 1.3,
  NA: 1.2,
  EUW: 1.15,
  EUNE: 0.9,
  BR: 0.8,
  LAN: 0.8,
  LAS: 0.75,
  OCE: 0.9,
  TR: 0.7,
  RU: 0.7,
  JP: 1.0,
};

export interface ValueScoreBreakdown {
  skinCount: number;
  skinPoints: number;
  bestRankTier: string | null;
  rankPoints: number;
  region: string;
  regionMultiplier: number;
  estimatedScore: number;
}

function rankedTierOf(status: RankedQueueStatus): string | null {
  return status.kind === 'ranked' ? status.tier.toUpperCase() : null;
}

function bestRankTier(ranked: RankedSummary): string | null {
  const candidates = [rankedTierOf(ranked.soloDuo), rankedTierOf(ranked.flex)].filter(
    (tier): tier is string => tier !== null,
  );
  if (candidates.length === 0) return null;

  return candidates.reduce((best, tier) =>
    (TIER_POINTS[tier] ?? 0) > (TIER_POINTS[best] ?? 0) ? tier : best,
  );
}

export function computeValueScore(
  summary: AccountSummary,
  ranked: RankedSummary,
  skins: OwnedSkin[],
): ValueScoreBreakdown {
  const realSkins = skins.filter((skin) => !skin.isSpecialMode);

  const skinPoints = realSkins.reduce(
    (sum, skin) => sum + POINTS_PER_SKIN + RARITY_POINTS[skin.rarity],
    0,
  );

  const bestTier = bestRankTier(ranked);
  const rankPoints = bestTier ? (TIER_POINTS[bestTier] ?? 0) : 0;

  const region = summary.region.toUpperCase();
  const regionMultiplier = REGION_MULTIPLIERS[region] ?? 1;

  const estimatedScore = Math.round((skinPoints + rankPoints) * regionMultiplier);

  return {
    skinCount: realSkins.length,
    skinPoints,
    bestRankTier: bestTier,
    rankPoints,
    region: summary.region,
    regionMultiplier,
    estimatedScore,
  };
}
