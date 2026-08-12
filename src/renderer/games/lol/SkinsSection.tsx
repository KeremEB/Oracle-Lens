import { useMemo } from 'react';
import type { OwnedSkin, SkinRarity } from '../../../shared/types/lol';
import { t } from '../../core/i18n';
import { matchesSearch } from '../../core/searchMatch';
import { SkinGrid } from './SkinGrid';

export type LegacyFilter = 'all' | 'legacyOnly' | 'nonLegacyOnly';

export function SkinsSection({
  skins,
  searchQuery,
  rarityFilter,
  legacyFilter,
}: {
  skins: OwnedSkin[];
  searchQuery: string;
  rarityFilter: SkinRarity | 'all';
  legacyFilter: LegacyFilter;
}) {
  // Skins arrive already sorted rarest-first from the provider; filtering
  // preserves that order.
  const visible = useMemo(
    () =>
      skins.filter((skin) => {
        if (rarityFilter !== 'all' && skin.rarity !== rarityFilter) return false;
        if (legacyFilter === 'legacyOnly' && !skin.isLegacy) return false;
        if (legacyFilter === 'nonLegacyOnly' && skin.isLegacy) return false;
        return matchesSearch(skin.name, searchQuery);
      }),
    [skins, rarityFilter, legacyFilter, searchQuery],
  );

  const { standard, other } = useMemo(
    () => ({
      standard: visible.filter((s) => !s.isSpecialMode),
      other: visible.filter((s) => s.isSpecialMode),
    }),
    [visible],
  );

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="w-full">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-300">
          {t('skins.title')}
        </h2>
        <SkinGrid skins={standard} />
      </div>

      {other.length > 0 && <SkinGrid title={t('skins.otherTitle')} skins={other} />}
    </div>
  );
}
