import type { RegionPricing, RpPackage, RpPricingTable } from '../../../shared/types/pricing';

export interface PackageLine {
  package: RpPackage;
  quantity: number;
}

export interface RpConversion {
  regionKey: string;
  pricing: RegionPricing;
  /** Cheapest cost that covers `targetRp`, in the region's local currency. */
  cost: number;
  /** RP actually bought — at or above the target, since packages are discrete. */
  rpPurchased: number;
  lines: PackageLine[];
}

/**
 * Picks the cheapest set of packages covering `targetRp`.
 *
 * Deliberately NOT greedy-by-largest-package: bigger bundles are not always
 * cheaper per RP. On TR the 28225 and 49550 bundles both cost more per RP than
 * the 13500 one, so buying largest-first overstates a 107,510 RP account by
 * about 17%. MENA, OCE and BR have smaller versions of the same inversion.
 *
 * Exact rather than heuristic, via a two-part search:
 *  1. Cover the bulk with the lowest-cost-per-RP package. No combination can
 *     beat the minimum unit price, so front-loading it is always safe as long
 *     as enough slack is left for the endgame to be optimised freely.
 *  2. Exhaustively solve the remainder (plus that slack) with a DP over every
 *     package, which is what catches the "one more mid-size bundle is cheaper
 *     than the big one" cases.
 */
export function solvePackages(targetRp: number, pricing: RegionPricing): {
  cost: number;
  rpPurchased: number;
  lines: PackageLine[];
} {
  const packages = pricing.packages.filter((pkg) => pkg.amount > 0 && pkg.price > 0);
  if (targetRp <= 0 || packages.length === 0) {
    return { cost: 0, rpPurchased: 0, lines: [] };
  }

  const maxAmount = Math.max(...packages.map((pkg) => pkg.amount));
  const best = packages.reduce((cheapest, pkg) =>
    pkg.price / pkg.amount < cheapest.price / cheapest.amount ? pkg : cheapest,
  );

  // Leave two full max-size packages of room so the DP can always reshuffle
  // the tail; only the clearly-bulk portion is fixed up front.
  const slack = maxAmount * 2;
  const bulkCount = Math.max(0, Math.floor((targetRp - slack) / best.amount));
  const remainder = targetRp - bulkCount * best.amount;

  // dp[i] = cheapest cost to buy at least i RP, for i up to remainder + one
  // more package (buying past the target is allowed and often cheaper).
  const cap = remainder + maxAmount;
  const dp = new Float64Array(cap + 1).fill(Infinity);
  const choice = new Int32Array(cap + 1).fill(-1);
  dp[0] = 0;

  for (let i = 1; i <= cap; i++) {
    for (let p = 0; p < packages.length; p++) {
      const pkg = packages[p];
      const prev = Math.max(0, i - pkg.amount);
      const candidate = dp[prev] + pkg.price;
      if (candidate < dp[i]) {
        dp[i] = candidate;
        choice[i] = p;
      }
    }
  }

  // Overshooting can be cheaper than landing exactly, so take the best index
  // at or past the remainder rather than dp[remainder].
  let bestIndex = remainder;
  for (let i = remainder; i <= cap; i++) {
    if (dp[i] < dp[bestIndex]) bestIndex = i;
  }

  const counts = new Map<RpPackage, number>();
  if (bulkCount > 0) counts.set(best, bulkCount);

  let cursor = bestIndex;
  while (cursor > 0 && choice[cursor] >= 0) {
    const pkg = packages[choice[cursor]];
    counts.set(pkg, (counts.get(pkg) ?? 0) + 1);
    cursor = Math.max(0, cursor - pkg.amount);
  }

  const lines = [...counts.entries()]
    .map(([pkg, quantity]) => ({ package: pkg, quantity }))
    .sort((a, b) => b.package.amount - a.package.amount);

  return {
    cost: lines.reduce((sum, line) => sum + line.package.price * line.quantity, 0),
    rpPurchased: lines.reduce((sum, line) => sum + line.package.amount * line.quantity, 0),
    lines,
  };
}

/** Resolves the account's region against the table, falling back when absent. */
export function resolveRegion(
  region: string,
  table: RpPricingTable,
): { key: string; pricing: RegionPricing; isFallback: boolean } {
  const key = region.toUpperCase();
  const direct = table.regions[key];
  if (direct) {
    return { key, pricing: direct, isFallback: false };
  }

  return {
    key: table.fallbackRegion,
    pricing: table.regions[table.fallbackRegion],
    isFallback: true,
  };
}

export function convertRp(
  targetRp: number,
  regionKey: string,
  pricing: RegionPricing,
): RpConversion {
  const solved = solvePackages(targetRp, pricing);
  return { regionKey, pricing, ...solved };
}

/** Every other region's cost for the same RP, for the comparison table. */
export function convertAcrossRegions(
  targetRp: number,
  table: RpPricingTable,
  excludeKey: string,
): RpConversion[] {
  return Object.entries(table.regions)
    .filter(([key]) => key !== excludeKey)
    .map(([key, pricing]) => convertRp(targetRp, key, pricing))
    .sort((a, b) => a.pricing.label.localeCompare(b.pricing.label));
}

export function formatCurrency(value: number, pricing: RegionPricing): string {
  const amount = value.toLocaleString('en-US', {
    minimumFractionDigits: pricing.decimals,
    maximumFractionDigits: pricing.decimals,
  });

  return pricing.symbolFirst ? `${pricing.symbol}${amount}` : `${amount} ${pricing.symbol}`;
}
