import { useMemo, useRef } from 'react';
import type { ChampionMasteryEntry } from '../../../shared/types/lol';
import { matchesSearch } from '../../core/searchMatch';
import { useGridDensity } from '../../core/GridDensityContext';
import { useCtrlScrollDensity } from '../../core/useCtrlScrollDensity';
import { compareTr, type SortOrder } from '../../core/sortOrder';
import { ChampionCard } from './ChampionCard';

export function ChampionGrid({
  title,
  champions,
  searchQuery,
  levelFilter,
  sortOrder,
}: {
  title: string;
  champions: ChampionMasteryEntry[];
  searchQuery: string;
  levelFilter: number | 'all';
  /** 'default' = mastery points, highest first (the provider's native order). */
  sortOrder: SortOrder;
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
    return [...filtered].sort((a, b) => {
      if (sortOrder === 'az') return compareTr(a.championName, b.championName);
      if (sortOrder === 'za') return compareTr(b.championName, a.championName);
      return b.masteryPoints - a.masteryPoints;
    });
  }, [champions, levelFilter, searchQuery, sortOrder]);

  return (
    <div className="w-full">
      <h2
        className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--game-accent)]"
        style={{ fontFamily: 'var(--game-font-display)' }}
      >
        {title}
      </h2>

      <div
        ref={gridRef}
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))` }}
      >
        {visibleChampions.map((champion) => (
          <ChampionCard key={champion.championId} champion={champion} minCardWidth={minCardWidth} />
        ))}
      </div>
    </div>
  );
}
