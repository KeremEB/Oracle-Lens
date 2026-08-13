import { useEffect, useState } from 'react';
import type { ChampionMasteryEntry } from '../../../shared/types/lol';
import { getMasteryCrestDataUrl } from './masteryCrestCache';

// Fixed regardless of grid density, per the "never scale these" requirement.
// The art is 800x900 (taller than wide), so width is derived from that ratio
// rather than forcing a square and squashing it.
const CREST_HEIGHT = 65;
const CREST_WIDTH = Math.round(CREST_HEIGHT * (800 / 900));
// Half the crest overflows below the portrait (straddling its bottom edge) —
// reserve that space explicitly so it never overlaps the name.
const CREST_OVERFLOW = CREST_HEIGHT / 2 - 6;

export function ChampionCard({ champion }: { champion: ChampionMasteryEntry }) {
  const [crestUrl, setCrestUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMasteryCrestDataUrl(champion.masteryLevel).then((url) => {
      if (!cancelled) setCrestUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [champion.masteryLevel]);

  return (
    <div className="flex flex-col items-center gap-1 rounded border border-neutral-800 bg-neutral-900/50 p-2 text-center">
      <div className="relative aspect-square w-full">
        {champion.iconDataUrl ? (
          <img
            src={champion.iconDataUrl}
            alt={champion.championName}
            className="h-full w-full rounded object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded bg-neutral-800 text-xs text-neutral-500">
            {champion.championName.slice(0, 2).toUpperCase()}
          </div>
        )}

        {/* Real per-level emblem art, straddling the portrait's bottom edge
            (half over the art, half below it). No drawn banner shape behind
            the number: the client's own mastery-banner-*.svg assets exist,
            but nothing in its CSS or JS exposes which banner maps to which
            level, and inventing that mapping would be a guess. */}
        {crestUrl && (
          <img
            src={crestUrl}
            alt={`Mastery ${champion.masteryLevel}`}
            className="pointer-events-none absolute left-1/2 z-10 object-contain"
            style={{
              bottom: -CREST_HEIGHT / 2,
              height: CREST_HEIGHT,
              width: CREST_WIDTH,
              transform: 'translateX(-50%)',
            }}
          />
        )}
      </div>

      <span
        className="w-full truncate text-xs"
        style={crestUrl ? { marginTop: CREST_OVERFLOW } : undefined}
      >
        {champion.championName}
      </span>
      <span className="text-[11px] text-neutral-500">
        {champion.masteryLevel > 0 ? `${champion.masteryLevel} · ` : ''}
        {champion.masteryPoints.toLocaleString('en-US')}
      </span>
    </div>
  );
}
