import { useMemo } from 'react';
import type { ChampionMasteryEntry } from '../../../shared/types/lol';
import { t } from '../../core/i18n';
import { ChampionGrid } from './ChampionGrid';

export function ChampionsSection({
  champions,
  searchQuery,
  hideFilters = false,
}: {
  champions: ChampionMasteryEntry[];
  searchQuery: string;
  /** Suppresses the mastery-level filter — the export report always shows everything. */
  hideFilters?: boolean;
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
        hideFilters={hideFilters}
      />
      {other.length > 0 && (
        <ChampionGrid
          title={t('champions.otherTitle')}
          champions={other}
          searchQuery={searchQuery}
          hideFilters={hideFilters}
        />
      )}
    </div>
  );
}
