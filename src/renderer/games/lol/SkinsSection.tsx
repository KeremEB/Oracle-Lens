import { useMemo } from 'react';
import type { OwnedSkin, SkinRarity } from '../../../shared/types/lol';
import { t } from '../../core/i18n';
import { matchesSearch } from '../../core/searchMatch';
import { compareTr, type SortOrder } from '../../core/sortOrder';
import { SkinGrid } from './SkinGrid';

export type LegacyFilter = 'all' | 'legacyOnly' | 'nonLegacyOnly';

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
  // Skins arrive already sorted rarest-first from the provider — filtering
  // preserves that order when sortOrder is 'default'; az/za override it.
  const visible = useMemo(() => {
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
  }, [skins, rarityFilter, legacyFilter, searchQuery, sortOrder]);

  const { standard, other } = useMemo(
    () => ({
      standard: visible.filter((s) => !s.isSpecialMode),
      other: visible.filter((s) => s.isSpecialMode),
    }),
    [visible],
  );

  return (
    <div className="flex w-full flex-col gap-8">
      <SkinGrid title={t('skins.title')} skins={standard} />

      {other.length > 0 && <SkinGrid title={t('skins.otherTitle')} skins={other} />}
    </div>
  );
}
