import { useEffect, useState } from 'react';
import type { ChampionMasteryEntry } from '../../../shared/types/lol';
import { getMasteryCrestDataUrl } from './masteryCrestCache';
import { getMasteryBannerDataUrl } from './masteryBannerCache';

// Crest+banner scale WITH grid density now (not fixed) — sized off the
// card's own minCardWidth (see GridDensityContext) rather than a constant,
// so the badge grows and shrinks along with the card instead of staying a
// fixed size while everything around it resizes.
const BADGE_SIZE_RATIO = 0.7;

export function ChampionCard({
  champion,
  minCardWidth,
}: {
  champion: ChampionMasteryEntry;
  minCardWidth: number;
}) {
  const [crestUrl, setCrestUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMasteryCrestDataUrl(champion.masteryLevel).then((url) => {
      if (!cancelled) setCrestUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [champion.masteryLevel]);

  useEffect(() => {
    let cancelled = false;
    getMasteryBannerDataUrl(champion.masteryLevel).then((url) => {
      if (!cancelled) setBannerUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [champion.masteryLevel]);

  // Crest art is 800x900 (taller than wide); banner art is 78x50. Both
  // derived from the same base so they scale together.
  const crestHeight = minCardWidth * BADGE_SIZE_RATIO;
  const crestWidth = crestHeight * (800 / 900);
  const bannerWidth = crestWidth * 1.05;
  const bannerHeight = bannerWidth * (50 / 78);
  // Crest art fills only the center ~52% of its own canvas height, so the
  // banner's top sits just past that opaque region — mostly peeking out
  // below the crest rather than hidden behind it.
  const bannerTop = crestHeight * 0.50;
  const crestOverflow = crestHeight / 2 - 2;

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
            edge. Banner tier (0-3) is looked up from the real level->banner
            mapping extracted from the client's own bundle — see
            cdn/lol.ts's getMasteryBannerDataUrl comment for how it was
            found; it's not a guessed grouping. */}
        {crestUrl && (
          <div
            className="pointer-events-none absolute left-1/2 z-10"
            style={{
              bottom: -crestHeight / 2,
              height: crestHeight,
              width: crestWidth,
              transform: 'translateX(-50%)',
            }}
          >
            {bannerUrl && (
              <img
                src={bannerUrl}
                alt=""
                className="absolute left-1/2"
                style={{
                  top: bannerTop,
                  width: bannerWidth,
                  height: bannerHeight,
                  transform: 'translateX(-50%)',
                }}
              />
            )}
            <img
              src={crestUrl}
              alt={`Mastery ${champion.masteryLevel}`}
              className="absolute inset-0 object-contain"
              style={{ height: crestHeight, width: crestWidth }}
            />
          </div>
        )}
      </div>

      <span
        className="w-full truncate text-xs"
        style={crestUrl ? { marginTop: crestOverflow } : undefined}
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
