import { useState } from 'react';
import type {
  AccountSummary,
  ChampionMasteryEntry,
  LootItem,
  OwnedEmote,
  OwnedProfileIcon,
  OwnedSkin,
  OwnedWardSkin,
  RankedSummary,
  SkinChromaGroup,
  SkinRarity,
} from '../../../shared/types/lol';
import type { AccountSnapshotMeta } from '../../../shared/types/core';
import { t } from '../../core/i18n';
import type { LolResource } from '../../core/useLolResource';
import { SidebarNav, type SidebarNavItem } from '../../core/SidebarNav';
import { GridDensityProvider } from '../../core/GridDensityContext';
import { FiltersRow } from './FiltersRow';
import { ChampionsSection } from './ChampionsSection';
import { SkinsSection, type LegacyFilter } from './SkinsSection';
import { ChromasSection } from './ChromasSection';
import { WardSkinsSection } from './WardSkinsSection';
import { EmotesSection } from './EmotesSection';
import { ProfileIconsSection } from './ProfileIconsSection';
import { LootSection } from './LootSection';
import { HistorySection } from './HistorySection';
import { ExportPanel } from './export/ExportPanel';
import type { ReportData } from './export/reportData';
import type { LolTabId } from './LolTabId';

// Individual chromas owned, not "skins that have any chroma" — matches
// export/reportData.ts's computeCollectionCounts.
function countChromas(groups: SkinChromaGroup[] | null): number | undefined {
  return groups?.reduce((sum, g) => sum + g.chromas.length, 0);
}

// Everything to the right of the game rail EXCEPT the account header, which
// lives in App.tsx now so it can span the full window width above both the
// rail and this sidebar — see App.tsx.
export function LolWorkspace({
  summary,
  ranked,
  champions,
  skins,
  chromas,
  wardSkins,
  emotes,
  profileIcons,
  loot,
  snapshots,
  activeSnapshotId,
  onViewSnapshot,
  onDeleteSnapshot,
  onClearSnapshots,
}: {
  summary: AccountSummary;
  /** null while the ranked fetch is still in flight — export is unavailable until it resolves. */
  ranked: RankedSummary | null;
  champions: LolResource<ChampionMasteryEntry[]>;
  skins: LolResource<OwnedSkin[]>;
  chromas: LolResource<SkinChromaGroup[]>;
  wardSkins: LolResource<OwnedWardSkin[]>;
  emotes: LolResource<OwnedEmote[]>;
  profileIcons: LolResource<OwnedProfileIcon[]>;
  loot: LolResource<LootItem[]>;
  snapshots: AccountSnapshotMeta[];
  activeSnapshotId: string | null;
  onViewSnapshot: (id: string) => void;
  onDeleteSnapshot: (id: string) => void;
  onClearSnapshots: () => void;
}) {
  const [activeTab, setActiveTab] = useState<LolTabId>('champions');
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState<SkinRarity | 'all'>('all');
  const [legacyFilter, setLegacyFilter] = useState<LegacyFilter>('all');
  const [levelFilter, setLevelFilter] = useState<number | 'all'>('all');

  const sidebarItems: SidebarNavItem[] = [
    { id: 'champions', label: t('champions.title'), count: champions.data?.length },
    { id: 'skins', label: t('skins.title'), count: skins.data?.length },
    { id: 'chromas', label: t('chromas.title'), count: countChromas(chromas.data) },
    { id: 'wardSkins', label: t('wardSkins.navTitle'), count: wardSkins.data?.length },
    { id: 'emotes', label: t('emotes.title'), count: emotes.data?.length },
    { id: 'profileIcons', label: t('profileIcons.title'), count: profileIcons.data?.length },
    // Loot is the player's unclaimed inventory, entirely separate from the
    // owned-collection tabs above — dividerBefore breaks it into its own
    // visual group rather than reading as one more collection tab.
    { id: 'loot', label: t('loot.title'), count: loot.data?.length, dividerBefore: true },
    { id: 'history', label: t('history.title'), count: snapshots.length, dividerBefore: true },
  ];

  const exportData: ReportData | null =
    champions.data &&
    skins.data &&
    chromas.data &&
    wardSkins.data &&
    emotes.data &&
    profileIcons.data &&
    loot.data
      ? {
          champions: champions.data,
          skins: skins.data,
          chromas: chromas.data,
          wardSkins: wardSkins.data,
          emotes: emotes.data,
          profileIcons: profileIcons.data,
          loot: loot.data,
        }
      : null;

  const exportPanel =
    exportData && ranked ? (
      <ExportPanel summary={summary} ranked={ranked} data={exportData} activeTab={activeTab} />
    ) : undefined;

  return (
    <div className="flex min-w-0 flex-1">
      {/* Theme (`--game-*` custom properties) comes from whichever class
          wraps the app root in App.tsx, not from a class applied here — so
          the sidebar and this content column always agree with the header
          and game rail on which palette is active. */}
      <SidebarNav items={sidebarItems} activeId={activeTab} onSelect={(id) => setActiveTab(id as LolTabId)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <FiltersRow
          activeTab={activeTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          rarityFilter={rarityFilter}
          onRarityFilterChange={setRarityFilter}
          legacyFilter={legacyFilter}
          onLegacyFilterChange={setLegacyFilter}
          levelFilter={levelFilter}
          onLevelFilterChange={setLevelFilter}
          champions={champions.data}
          exportPanel={exportPanel}
        />

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <GridDensityProvider>
            {activeTab === 'champions' && (
              <>
                {champions.error && <p className="text-red-400">{champions.error}</p>}
                {!champions.error && !champions.data && (
                  <p className="text-neutral-400">{t('champions.loading')}</p>
                )}
                {champions.data && (
                  <ChampionsSection
                    champions={champions.data}
                    searchQuery={searchQuery}
                    levelFilter={levelFilter}
                  />
                )}
              </>
            )}

            {activeTab === 'skins' && (
              <>
                {skins.error && <p className="text-red-400">{skins.error}</p>}
                {!skins.error && !skins.data && (
                  <p className="text-neutral-400">{t('skins.loading')}</p>
                )}
                {skins.data && (
                  <SkinsSection
                    skins={skins.data}
                    searchQuery={searchQuery}
                    rarityFilter={rarityFilter}
                    legacyFilter={legacyFilter}
                  />
                )}
              </>
            )}

            {activeTab === 'chromas' && (
              <>
                {chromas.error && <p className="text-red-400">{chromas.error}</p>}
                {!chromas.error && !chromas.data && (
                  <p className="text-neutral-400">{t('chromas.loading')}</p>
                )}
                {chromas.data && <ChromasSection groups={chromas.data} searchQuery={searchQuery} />}
              </>
            )}

            {activeTab === 'wardSkins' && (
              <>
                {wardSkins.error && <p className="text-red-400">{wardSkins.error}</p>}
                {!wardSkins.error && !wardSkins.data && (
                  <p className="text-neutral-400">{t('wardSkins.loading')}</p>
                )}
                {wardSkins.data && (
                  <WardSkinsSection wards={wardSkins.data} searchQuery={searchQuery} />
                )}
              </>
            )}

            {activeTab === 'emotes' && (
              <>
                {emotes.error && <p className="text-red-400">{emotes.error}</p>}
                {!emotes.error && !emotes.data && (
                  <p className="text-neutral-400">{t('emotes.loading')}</p>
                )}
                {emotes.data && <EmotesSection emotes={emotes.data} searchQuery={searchQuery} />}
              </>
            )}

            {activeTab === 'profileIcons' && (
              <>
                {profileIcons.error && <p className="text-red-400">{profileIcons.error}</p>}
                {!profileIcons.error && !profileIcons.data && (
                  <p className="text-neutral-400">{t('profileIcons.loading')}</p>
                )}
                {profileIcons.data && (
                  <ProfileIconsSection icons={profileIcons.data} searchQuery={searchQuery} />
                )}
              </>
            )}

            {activeTab === 'loot' && (
              <>
                {loot.error && <p className="text-red-400">{loot.error}</p>}
                {!loot.error && !loot.data && <p className="text-neutral-400">{t('loot.loading')}</p>}
                {loot.data && <LootSection items={loot.data} searchQuery={searchQuery} />}
              </>
            )}

            {activeTab === 'history' && (
              <HistorySection
                snapshots={snapshots}
                activeSnapshotId={activeSnapshotId}
                onView={onViewSnapshot}
                onDelete={onDeleteSnapshot}
                onClearAll={onClearSnapshots}
              />
            )}
          </GridDensityProvider>
        </div>
      </div>
    </div>
  );
}
