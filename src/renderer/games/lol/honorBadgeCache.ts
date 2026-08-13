// Only 5 distinct badges exist (levels 1-5; 0 and 6+ have no art — see
// cdn/lol.ts), so memoize per level rather than re-invoking the bridge.
const cache = new Map<number, Promise<string | null>>();

export function getHonorBadgeDataUrl(level: number): Promise<string | null> {
  let promise = cache.get(level);
  if (!promise) {
    promise = window.oracleLens.lol.getHonorBadgeUrl(level);
    cache.set(level, promise);
  }
  return promise;
}
