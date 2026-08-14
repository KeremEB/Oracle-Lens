import { useMemo, type ReactNode } from 'react';
import type { ChampionMasteryEntry, SkinRarity } from '../../../shared/types/lol';
import { t } from '../../core/i18n';
import type { SortOrder } from '../../core/sortOrder';
import { allRarities, rarityLabel } from './rarity';
import type { LegacyFilter } from './SkinsSection';
import type { LolTabId } from './LolTabId';

const selectClass =
  'rounded-sm border border-[var(--game-accent-dark)] bg-[var(--game-surface-elevated)] px-2 py-1 text-sm text-[var(--game-accent-soft)] outline-none transition-[border-color,box-shadow] duration-150 hover:border-[var(--game-accent)] hover:shadow-[0_0_8px_1px_var(--game-glow)] focus:border-[var(--game-accent)]';

const labelClass = 'text-sm text-[var(--game-accent-muted)]';

// Which sort choices each tab offers, and their labels. Tabs with no
// meaningful native order (everything but champions/skins) only ever offer
// az/za — 'default' isn't a real option for them.
const SORT_OPTIONS: Partial<Record<LolTabId, { value: SortOrder; labelKey: 'sort.masteryPoints' | 'sort.rarity' | 'sort.az' | 'sort.za' }[]>> = {
  champions: [
    { value: 'default', labelKey: 'sort.masteryPoints' },
    { value: 'az', labelKey: 'sort.az' },
    { value: 'za', labelKey: 'sort.za' },
  ],
  skins: [
    { value: 'default', labelKey: 'sort.rarity' },
    { value: 'az', labelKey: 'sort.az' },
    { value: 'za', labelKey: 'sort.za' },
  ],
  chromas: [
    { value: 'az', labelKey: 'sort.az' },
    { value: 'za', labelKey: 'sort.za' },
  ],
  wardSkins: [
    { value: 'az', labelKey: 'sort.az' },
    { value: 'za', labelKey: 'sort.za' },
  ],
  emotes: [
    { value: 'az', labelKey: 'sort.az' },
    { value: 'za', labelKey: 'sort.za' },
  ],
  profileIcons: [
    { value: 'az', labelKey: 'sort.az' },
    { value: 'za', labelKey: 'sort.za' },
  ],
  loot: [
    { value: 'az', labelKey: 'sort.az' },
    { value: 'za', labelKey: 'sort.za' },
  ],
};

// One row above the content area at `lg` and up: search (always present)
// plus whichever filter controls the active tab actually has. Filter state
// lives in the shell (LolWorkspace), not in the section components — this is
// the single place those controls render.
//
// Below `lg` there isn't room for all of that on one line, so it splits into
// two adjacent rows instead of squeezing or scrolling sideways: the search
// box (`flex-[1_1_100%]` — full-width, which is also what forces the wrap)
// on its own line, then filters/sort/export flowing and wrapping together on
// the line below. The scroll hint text is desktop-only real estate (`lg:
// inline`) — there's no room to explain a shortcut that doesn't fit.
//
// At `lg`+, search + the active tab's filters live in their own `min-w-0
// flex-1 overflow-x-auto` sub-row so a narrow-but-still-wide window scrolls
// just that group; the export panel sits outside it as a shrink-0 sibling so
// it's never part of the scrolling content and always stays fully visible at
// the right edge.
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
  sortOrder,
  onSortOrderChange,
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
  /** The active tab's own remembered sort choice — absent (unused) on tabs with no sort control, e.g. History. */
  sortOrder: SortOrder;
  onSortOrderChange: (value: SortOrder) => void;
  /** Rendered right-aligned on this same row — absent until every collection has finished loading. */
  exportPanel?: ReactNode;
}) {
  const availableLevels = useMemo(
    () => [...new Set((champions ?? []).map((c) => c.masteryLevel))].sort((a, b) => b - a),
    [champions],
  );

  const sortOptions = SORT_OPTIONS[activeTab];

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[var(--game-accent-dark)] bg-[var(--game-surface-card)] px-6 py-3 lg:flex-nowrap">
      {/* `flex-[1_1_100%]` claims the entire row below `lg`, which is what
          forces everything else onto a second line — at `lg`+ it switches to
          a capped `flex-1` and shares the row like before. Either way it
          never shrinks past `min-w`. */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={t('search.placeholder')}
        className="min-w-[96px] flex-[1_1_100%] rounded-sm border border-[var(--game-accent-dark)] bg-[var(--game-surface-elevated)] px-3 py-1.5 text-sm text-[var(--game-accent-soft)] outline-none placeholder:text-[var(--game-accent-muted)] focus:border-[var(--game-accent)] lg:max-w-xs lg:flex-1"
      />

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2 lg:flex-nowrap lg:overflow-x-auto">
        {activeTab === 'champions' && (
          <div className="flex shrink-0 items-center gap-2">
            <label htmlFor="champions-level-filter" className={`${labelClass} hidden lg:inline`}>
              {t('champions.filterByLevel')}
            </label>
            <select
              id="champions-level-filter"
              aria-label={t('champions.filterByLevel')}
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
              <label htmlFor="skins-rarity" className={`${labelClass} hidden lg:inline`}>
                {t('skins.filterByRarity')}
              </label>
              <select
                id="skins-rarity"
                aria-label={t('skins.filterByRarity')}
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
              <label htmlFor="skins-legacy" className={`${labelClass} hidden lg:inline`}>
                {t('skins.filterByLegacy')}
              </label>
              <select
                id="skins-legacy"
                aria-label={t('skins.filterByLegacy')}
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

        {sortOptions && (
          <div className="flex shrink-0 items-center gap-2">
            <label htmlFor="tab-sort-order" className={`${labelClass} hidden lg:inline`}>
              {t('sort.label')}
            </label>
            <select
              id="tab-sort-order"
              aria-label={t('sort.label')}
              className={selectClass}
              value={sortOrder}
              onChange={(e) => onSortOrderChange(e.target.value as SortOrder)}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <span
        className="hidden shrink-0 whitespace-nowrap text-xs opacity-60 lg:inline"
        style={{ color: 'var(--game-accent-muted)' }}
      >
        {t('filters.hint')}
      </span>

      {exportPanel && <div className="shrink-0 lg:ml-4">{exportPanel}</div>}
    </div>
  );
}
