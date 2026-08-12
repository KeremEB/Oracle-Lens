import { useMemo, useRef, useState } from 'react';
import type { ChampionMasteryEntry } from '../../../shared/types/lol';
import { t } from '../../core/i18n';
import { matchesSearch } from '../../core/searchMatch';
import { useGridDensity } from '../../core/GridDensityContext';
import { useCtrlScrollDensity } from '../../core/useCtrlScrollDensity';
import { ChampionCard } from './ChampionCard';

export function ChampionGrid({
  title,
  champions,
  searchQuery,
  hideFilters = false,
}: {
  title: string;
  champions: ChampionMasteryEntry[];
  searchQuery: string;
  hideFilters?: boolean;
}) {
  const [levelFilter, setLevelFilter] = useState<number | 'all'>('all');
  const filterId = `mastery-level-filter-${title.replace(/\s+/g, '-').toLowerCase()}`;

  const gridRef = useRef<HTMLDivElement>(null);
  const { minCardWidth, adjustDensity } = useGridDensity();
  useCtrlScrollDensity(gridRef, adjustDensity);

  const availableLevels = useMemo(
    () => [...new Set(champions.map((c) => c.masteryLevel))].sort((a, b) => b - a),
    [champions],
  );

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

      {!hideFilters && (
        <div className="mb-3 flex items-center gap-2">
          <label htmlFor={filterId} className="text-sm text-neutral-400">
            {t('champions.filterByLevel')}
          </label>
          <select
            id={filterId}
            className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-neutral-100"
            value={levelFilter}
            onChange={(e) =>
              setLevelFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
            }
          >
            <option value="all">{t('champions.allLevels')}</option>
            {availableLevels.map((level) => (
              <option key={level} value={level}>
                {level === 0 ? t('champions.unplayed') : level}
              </option>
            ))}
          </select>
        </div>
      )}

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
