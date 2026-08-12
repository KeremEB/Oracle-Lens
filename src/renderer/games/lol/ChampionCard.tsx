import { useEffect, useState } from 'react';
import type { ChampionMasteryEntry } from '../../../shared/types/lol';
import { getMasteryCrestDataUrl } from './masteryCrestCache';

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

        {/* Fixed size regardless of card density, per the "never scale these" requirement. */}
        {crestUrl && (
          <img
            src={crestUrl}
            alt={`Mastery ${champion.masteryLevel}`}
            className="absolute -bottom-1 -right-1 h-6 w-6 shrink-0"
          />
        )}
      </div>

      <span className="w-full truncate text-xs">{champion.championName}</span>
      <span className="text-[11px] text-neutral-500">
        {champion.masteryLevel} · {champion.masteryPoints.toLocaleString('en-US')}
      </span>
    </div>
  );
}
