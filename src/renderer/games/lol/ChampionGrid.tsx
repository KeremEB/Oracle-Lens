import { useMemo, useState } from 'react';
import type { ChampionMasteryEntry } from '../../../shared/types/lol';
import { t } from '../../core/i18n';
import { ChampionCard } from './ChampionCard';

export function ChampionGrid({
  title,
  champions,
}: {
  title: string;
  champions: ChampionMasteryEntry[];
}) {
  const [levelFilter, setLevelFilter] = useState<number | 'all'>('all');
  const filterId = `mastery-level-filter-${title.replace(/\s+/g, '-').toLowerCase()}`;

  const availableLevels = useMemo(
    () => [...new Set(champions.map((c) => c.masteryLevel))].sort((a, b) => b - a),
    [champions],
  );

  const visibleChampions = useMemo(() => {
    const filtered =
      levelFilter === 'all' ? champions : champions.filter((c) => c.masteryLevel === levelFilter);
    return [...filtered].sort((a, b) => b.masteryPoints - a.masteryPoints);
  }, [champions, levelFilter]);

  return (
    <div className="w-full">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-300">{title}</h2>

      <div className="mb-3 flex items-center gap-2">
        <label htmlFor={filterId} className="text-sm text-neutral-400">
          {t('champions.filterByLevel')}
        </label>
        <select
          id={filterId}
          className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-neutral-100"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
        >
          <option value="all">{t('champions.allLevels')}</option>
          {availableLevels.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-3">
        {visibleChampions.map((champion) => (
          <ChampionCard key={champion.championId} champion={champion} />
        ))}
      </div>
    </div>
  );
}
