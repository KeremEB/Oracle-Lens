import { useEffect, useState } from 'react';
import type { ChampionMasteryEntry } from '../../../shared/types/lol';
import { getMasteryCrestDataUrl } from './masteryCrestCache';

// Fixed regardless of grid density, per the "never scale these" requirement.
const CREST_SIZE = 56;
// No separate banner/frame asset exists — checked Community Dragon's actual
// directory listing for legendarychampionmastery/ (not a guess): it only
// has masterycrest_level{N}.png and a smaller "_minis" variant per level,
// nothing else. The ribbon is drawn with CSS instead, sized relative to the
// crest so it reads as one badge rather than two unrelated pieces.
const BANNER_WIDTH = CREST_SIZE * 1.3;
const BANNER_HEIGHT = CREST_SIZE * 0.34;
// Crest art fills only the center ~52% of its own canvas height (measured),
// so the banner's vertical center sits just past that opaque region —
// mostly peeking out below the crest rather than fully hidden under it.
const BANNER_TOP = CREST_SIZE * 0.66;
// Half the badge overflows below the portrait (straddling its bottom edge)
// — reserve that space explicitly so it never overlaps the name.
const BADGE_OVERFLOW = CREST_SIZE / 2 + 6;

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

        {/* Crest + banner as one badge, straddling the portrait's bottom
            edge (half over the art, half below it) — not a separate row. */}
        <div
          className="pointer-events-none absolute left-1/2 z-10"
          style={{
            bottom: -CREST_SIZE / 2,
            width: CREST_SIZE,
            height: CREST_SIZE,
            transform: 'translateX(-50%)',
          }}
        >
          {/* Banner: behind the crest (z-0). */}
          <div
            className="absolute left-1/2 z-0 bg-neutral-800 ring-1 ring-neutral-600"
            style={{
              top: BANNER_TOP,
              width: BANNER_WIDTH,
              height: BANNER_HEIGHT,
              transform: 'translateX(-50%)',
              clipPath: 'polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)',
            }}
          />

          {/* Crest: in front of the banner (z-10). */}
          {crestUrl && (
            <img
              src={crestUrl}
              alt={`Mastery ${champion.masteryLevel}`}
              className="absolute inset-0 z-10"
              style={{ height: CREST_SIZE, width: CREST_SIZE }}
            />
          )}

          {/* Level number: always on top of both (z-20) — the crest's own
              art can otherwise paint over the banner at this size. */}
          <span
            className="absolute left-1/2 z-20 text-[11px] font-bold leading-none text-neutral-100"
            style={{
              top: BANNER_TOP + BANNER_HEIGHT / 2,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {champion.masteryLevel}
          </span>
        </div>
      </div>

      <span className="w-full truncate text-xs" style={{ marginTop: BADGE_OVERFLOW }}>
        {champion.championName}
      </span>
      <span className="text-[11px] text-neutral-500">
        {champion.masteryPoints.toLocaleString('en-US')}
      </span>
    </div>
  );
}
