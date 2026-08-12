import { useMemo, useState } from 'react';
import type { OwnedSkin, SkinAvailability, SkinRarity } from '../../../shared/types/lol';
import { t } from '../../core/i18n';
import { matchesSearch } from '../../core/searchMatch';
import { allRarities, rarityLabel } from './rarity';
import { allAvailabilities, availabilityLabel } from './availability';
import { SkinGrid } from './SkinGrid';

type LegacyFilter = 'all' | 'legacyOnly' | 'nonLegacyOnly';

export function SkinsSection({ skins, searchQuery }: { skins: OwnedSkin[]; searchQuery: string }) {
  const [rarityFilter, setRarityFilter] = useState<SkinRarity | 'all'>('all');
  const [legacyFilter, setLegacyFilter] = useState<LegacyFilter>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<SkinAvailability | 'all'>('all');

  // Skins arrive already sorted rarest-first from the provider; filtering
  // preserves that order.
  const visible = useMemo(
    () =>
      skins.filter((skin) => {
        if (rarityFilter !== 'all' && skin.rarity !== rarityFilter) return false;
        if (availabilityFilter !== 'all' && skin.availability !== availabilityFilter) return false;
        if (legacyFilter === 'legacyOnly' && !skin.isLegacy) return false;
        if (legacyFilter === 'nonLegacyOnly' && skin.isLegacy) return false;
        return matchesSearch(skin.name, searchQuery);
      }),
    [skins, rarityFilter, availabilityFilter, legacyFilter, searchQuery],
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

        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="skins-rarity" className="text-sm text-neutral-400">
              {t('skins.filterByRarity')}
            </label>
            <select
              id="skins-rarity"
              className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-neutral-100"
              value={rarityFilter}
              onChange={(e) =>
                setRarityFilter(e.target.value === 'all' ? 'all' : (e.target.value as SkinRarity))
              }
            >
              <option value="all">{t('skins.allRarities')}</option>
              {allRarities().map((rarity) => (
                <option key={rarity} value={rarity}>
                  {rarityLabel(rarity)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="skins-availability" className="text-sm text-neutral-400">
              {t('skins.filterByAvailability')}
            </label>
            <select
              id="skins-availability"
              className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-neutral-100"
              value={availabilityFilter}
              onChange={(e) =>
                setAvailabilityFilter(
                  e.target.value === 'all' ? 'all' : (e.target.value as SkinAvailability),
                )
              }
            >
              <option value="all">{t('skins.allAvailabilities')}</option>
              {allAvailabilities().map((availability) => (
                <option key={availability} value={availability}>
                  {availabilityLabel(availability)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="skins-legacy" className="text-sm text-neutral-400">
              {t('skins.filterByLegacy')}
            </label>
            <select
              id="skins-legacy"
              className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-neutral-100"
              value={legacyFilter}
              onChange={(e) => setLegacyFilter(e.target.value as LegacyFilter)}
            >
              <option value="all">{t('skins.legacyAll')}</option>
              <option value="legacyOnly">{t('skins.legacyOnly')}</option>
              <option value="nonLegacyOnly">{t('skins.legacyExclude')}</option>
            </select>
          </div>
        </div>

        <SkinGrid skins={standard} />
      </div>

      {other.length > 0 && <SkinGrid title={t('skins.otherTitle')} skins={other} />}
    </div>
  );
}
