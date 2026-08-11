// Only 10 distinct crest images exist regardless of how many champions are
// shown, so memoize per level rather than re-invoking the bridge per card.
const cache = new Map<number, Promise<string | null>>();

export function getMasteryCrestDataUrl(level: number): Promise<string | null> {
  let promise = cache.get(level);
  if (!promise) {
    promise = window.oracleLens.lol.getMasteryCrestUrl(level);
    cache.set(level, promise);
  }
  return promise;
}
