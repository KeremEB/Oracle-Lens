import { useMemo, useRef } from 'react';
import type { ChampionMasteryEntry } from '../../../shared/types/lol';
import { matchesSearch } from '../../core/searchMatch';
import { useGridDensity } from '../../core/GridDensityContext';
import { useCtrlScrollDensity } from '../../core/useCtrlScrollDensity';
import { ChampionCard } from './ChampionCard';

export function ChampionGrid({
  title,
  champions,
  searchQuery,
  levelFilter,
}: {
  title: string;
  champions: ChampionMasteryEntry[];
  searchQuery: string;
  levelFilter: number | 'all';
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const { minCardWidth, adjustDensity } = useGridDensity();
  useCtrlScrollDensity(gridRef, adjustDensity);

  const visibleChampions = useMemo(() => {
    const filtered = champions.filter(
      (c) =>
        (levelFilter === 'all' || c.masteryLevel === levelFilter) &&
        matchesSearch(c.championName, searchQuery),
    );
    return [...filtered].sort((a, b) => b.masteryPoints - a.masteryPoints);
  }, [champions, levelFilter, searchQuery]);

  return (
    <div className="w-full">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-300">{title}</h2>

      <div
        ref={gridRef}
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))` }}
      >
        {visibleChampions.map((champion) => (
          <ChampionCard key={champion.championId} champion={champion} />
        ))}
      </div>
    </div>
  );
}
