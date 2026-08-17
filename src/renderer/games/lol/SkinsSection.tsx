import { useMemo } from 'react';
import type { OwnedSkin, SkinRarity } from '../../../shared/types/lol';
import { t } from '../../core/i18n';
import { matchesSearch } from '../../core/searchMatch';
import { compareTr, type SortOrder } from '../../core/sortOrder';
import { SkinGrid } from './SkinGrid';

export type LegacyFilter = 'all' | 'legacyOnly' | 'nonLegacyOnly';

// Shared by SkinsSection and ClassicSection (see ClassicSection.tsx) — same
// rarity/legacy/search filtering and rarity-or-alphabetical sort, just over
// a different slice of the owned-skins list.
export function filterAndSortSkins(
  skins: OwnedSkin[],
  {
    rarityFilter,
    legacyFilter,
    searchQuery,
    sortOrder,
  }: { rarityFilter: SkinRarity | 'all'; legacyFilter: LegacyFilter; searchQuery: string; sortOrder: SortOrder },
): OwnedSkin[] {
  // Skins arrive already sorted rarest-first from the provider — filtering
  // preserves that order when sortOrder is 'default'; az/za override it.
  const filtered = skins.filter((skin) => {
    if (rarityFilter !== 'all' && skin.rarity !== rarityFilter) return false;
    if (legacyFilter === 'legacyOnly' && !skin.isLegacy) return false;
    if (legacyFilter === 'nonLegacyOnly' && skin.isLegacy) return false;
    return matchesSearch(skin.name, searchQuery);
  });
  if (sortOrder === 'default') return filtered;
  return [...filtered].sort((a, b) =>
    sortOrder === 'az' ? compareTr(a.name, b.name) : compareTr(b.name, a.name),
  );
}

// Special-mode (isSpecialMode) skins live in the Classic tab now — see
// ClassicSection.tsx — so this only ever shows the standard collection.
export function SkinsSection({
  skins,
  searchQuery,
  rarityFilter,
  legacyFilter,
  sortOrder,
}: {
  skins: OwnedSkin[];
  searchQuery: string;
  rarityFilter: SkinRarity | 'all';
  legacyFilter: LegacyFilter;
  /** 'default' = rarest first (the provider's native order). */
  sortOrder: SortOrder;
}) {
  const visible = useMemo(
    () =>
      filterAndSortSkins(
        skins.filter((s) => !s.isSpecialMode),
        { rarityFilter, legacyFilter, searchQuery, sortOrder },
      ),
    [skins, rarityFilter, legacyFilter, searchQuery, sortOrder],
  );

  return <SkinGrid title={t('skins.title')} skins={visible} />;
}
