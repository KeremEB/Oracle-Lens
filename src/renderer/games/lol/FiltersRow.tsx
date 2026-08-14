import { useMemo, type ReactNode } from 'react';
import type { ChampionMasteryEntry, SkinRarity } from '../../../shared/types/lol';
import { t } from '../../core/i18n';
import { allRarities, rarityLabel } from './rarity';
import type { LegacyFilter } from './SkinsSection';
import type { LolTabId } from './LolTabId';

const selectClass =
  'rounded-sm border border-[var(--game-accent-dark)] bg-[var(--game-surface-elevated)] px-2 py-1 text-sm text-[var(--game-accent-soft)] outline-none focus:border-[var(--game-accent)]';

const labelClass = 'text-sm text-[var(--game-accent-muted)]';

// One horizontal row above the content area: search (always present) plus
// whichever filter controls the active tab actually has. Filter state lives
// in the shell (LolWorkspace), not in the section components — this is the
// single place those controls render, so search and a tab's filters always
// end up on one line instead of stacked rows.
export function FiltersRow({
  activeTab,
  searchQuery,
  onSearchChange,
  rarityFilter,
  onRarityFilterChange,
  legacyFilter,
  onLegacyFilterChange,
  levelFilter,
  onLevelFilterChange,
  champions,
  exportPanel,
}: {
  activeTab: LolTabId;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  rarityFilter: SkinRarity | 'all';
  onRarityFilterChange: (value: SkinRarity | 'all') => void;
  legacyFilter: LegacyFilter;
  onLegacyFilterChange: (value: LegacyFilter) => void;
  levelFilter: number | 'all';
  onLevelFilterChange: (value: number | 'all') => void;
  /** Only needed to populate the mastery-level dropdown's options. */
  champions: ChampionMasteryEntry[] | null;
  /** Rendered right-aligned on this same row — absent until every collection has finished loading. */
  exportPanel?: ReactNode;
}) {
  const availableLevels = useMemo(
    () => [...new Set((champions ?? []).map((c) => c.masteryLevel))].sort((a, b) => b - a),
    [champions],
  );

  return (
    <div className="flex flex-nowrap items-center gap-4 overflow-x-auto border-b border-[var(--game-accent-dark)] bg-[var(--game-surface-card)] px-6 py-3">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={t('search.placeholder')}
        className="min-w-[96px] max-w-xs flex-1 rounded-sm border border-[var(--game-accent-dark)] bg-[var(--game-surface-elevated)] px-3 py-1.5 text-sm text-[var(--game-accent-soft)] outline-none placeholder:text-[var(--game-accent-muted)] focus:border-[var(--game-accent)]"
      />

      {activeTab === 'champions' && (
        <div className="flex shrink-0 items-center gap-2">
          <label htmlFor="champions-level-filter" className={labelClass}>
            {t('champions.filterByLevel')}
          </label>
          <select
            id="champions-level-filter"
            className={selectClass}
            value={levelFilter}
            onChange={(e) =>
              onLevelFilterChange(e.target.value === 'all' ? 'all' : Number(e.target.value))
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

      {activeTab === 'skins' && (
        <>
          <div className="flex shrink-0 items-center gap-2">
            <label htmlFor="skins-rarity" className={labelClass}>
              {t('skins.filterByRarity')}
            </label>
            <select
              id="skins-rarity"
              className={selectClass}
              value={rarityFilter}
              onChange={(e) =>
                onRarityFilterChange(e.target.value === 'all' ? 'all' : (e.target.value as SkinRarity))
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

          <div className="flex shrink-0 items-center gap-2">
            <label htmlFor="skins-legacy" className={labelClass}>
              {t('skins.filterByLegacy')}
            </label>
            <select
              id="skins-legacy"
              className={selectClass}
              value={legacyFilter}
              onChange={(e) => onLegacyFilterChange(e.target.value as LegacyFilter)}
            >
              <option value="all">{t('skins.legacyAll')}</option>
              <option value="legacyOnly">{t('skins.legacyOnly')}</option>
              <option value="nonLegacyOnly">{t('skins.legacyExclude')}</option>
            </select>
          </div>
        </>
      )}

      {exportPanel && <div className="ml-auto shrink-0">{exportPanel}</div>}
    </div>
  );
}
