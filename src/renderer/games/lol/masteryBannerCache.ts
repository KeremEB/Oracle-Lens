// Only 4 distinct banner images exist regardless of how many champions are
// shown (levels group into 4 banner tiers — see cdn/lol.ts), so memoize per
// level rather than re-invoking the bridge per card.
const cache = new Map<number, Promise<string | null>>();

export function getMasteryBannerDataUrl(level: number): Promise<string | null> {
  let promise = cache.get(level);
  if (!promise) {
    promise = window.oracleLens.lol.getMasteryBannerUrl(level);
    cache.set(level, promise);
  }
  return promise;
}
