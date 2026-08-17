import { useMemo } from 'react';
import type { ChampionMasteryEntry, OwnedSkin, SkinRarity } from '../../../shared/types/lol';
import { t } from '../../core/i18n';
import type { SortOrder } from '../../core/sortOrder';
import { ChampionGrid } from './ChampionGrid';
import { SkinGrid } from './SkinGrid';
import { filterAndSortSkins, type LegacyFilter } from './SkinsSection';

// Rotating special-mode/event content (ARAM, Nexus Blitz, URF, ...) that used
// to appear as a "Classic" sub-section inside Champions and Skins — now its
// own tab. Shares the workspace's search/filter/sort/grid-density state with
// those two tabs (see FiltersRow.tsx), it just applies both the champion
// filter and the skin filters at once since both kinds of content live here.
export function ClassicSection({
  champions,
  skins,
  searchQuery,
  levelFilter,
  rarityFilter,
  legacyFilter,
  sortOrder,
}: {
  champions: ChampionMasteryEntry[];
  skins: OwnedSkin[];
  searchQuery: string;
  levelFilter: number | 'all';
  rarityFilter: SkinRarity | 'all';
  legacyFilter: LegacyFilter;
  sortOrder: SortOrder;
}) {
  const classicChampions = useMemo(() => champions.filter((c) => c.isSpecialMode), [champions]);
  const classicSkins = useMemo(
    () =>
      filterAndSortSkins(
        skins.filter((s) => s.isSpecialMode),
        { rarityFilter, legacyFilter, searchQuery, sortOrder },
      ),
    [skins, rarityFilter, legacyFilter, searchQuery, sortOrder],
  );

  return (
    <div className="flex w-full flex-col gap-4">
      <ChampionGrid
        title={t('classic.championsTitle')}
        champions={classicChampions}
        searchQuery={searchQuery}
        levelFilter={levelFilter}
        sortOrder={sortOrder}
      />
      <SkinGrid title={t('classic.skinsTitle')} skins={classicSkins} />
    </div>
  );
}
