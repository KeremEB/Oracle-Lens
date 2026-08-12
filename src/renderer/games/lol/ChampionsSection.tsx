import { useMemo } from 'react';
import type { ChampionMasteryEntry } from '../../../shared/types/lol';
import { t } from '../../core/i18n';
import { ChampionGrid } from './ChampionGrid';

export function ChampionsSection({
  champions,
  searchQuery,
  levelFilter,
}: {
  champions: ChampionMasteryEntry[];
  searchQuery: string;
  levelFilter: number | 'all';
}) {
  const { standard, other } = useMemo(
    () => ({
      standard: champions.filter((c) => !c.isSpecialMode),
      other: champions.filter((c) => c.isSpecialMode),
    }),
    [champions],
  );

  return (
    <div className="flex w-full flex-col gap-8">
      <ChampionGrid
        title={t('champions.title')}
        champions={standard}
        searchQuery={searchQuery}
        levelFilter={levelFilter}
      />
      {other.length > 0 && (
        <ChampionGrid
          title={t('champions.otherTitle')}
          champions={other}
          searchQuery={searchQuery}
          levelFilter={levelFilter}
        />
      )}
    </div>
  );
}
