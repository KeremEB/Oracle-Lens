import { useMemo } from 'react';
import type { ChampionMasteryEntry } from '../../../shared/types/lol';
import { t } from '../../core/i18n';
import type { SortOrder } from '../../core/sortOrder';
import { ChampionGrid } from './ChampionGrid';

// Special-mode (isSpecialMode) champions live in the Classic tab now — see
// ClassicSection.tsx — so this only ever shows the standard roster.
export function ChampionsSection({
  champions,
  searchQuery,
  levelFilter,
  sortOrder,
}: {
  champions: ChampionMasteryEntry[];
  searchQuery: string;
  levelFilter: number | 'all';
  sortOrder: SortOrder;
}) {
  const standard = useMemo(() => champions.filter((c) => !c.isSpecialMode), [champions]);

  return (
    <ChampionGrid
      title={t('champions.title')}
      champions={standard}
      searchQuery={searchQuery}
      levelFilter={levelFilter}
      sortOrder={sortOrder}
    />
  );
}
