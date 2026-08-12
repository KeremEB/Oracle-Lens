import { useState } from 'react';
import type {
  AccountSummary,
  ChampionMasteryEntry,
  OwnedEmote,
  OwnedProfileIcon,
  OwnedSkin,
  OwnedWardSkin,
  RankedSummary,
  SkinChromaGroup,
  SkinRarity,
  Wallet,
} from '../../../shared/types/lol';
import { t } from '../../core/i18n';
import type { LolResource } from '../../core/useLolResource';
import { SidebarNav, type SidebarNavItem } from '../../core/SidebarNav';
import { GridDensityProvider } from '../../core/GridDensityContext';
import { AccountHeader } from './AccountHeader';
import { FiltersRow } from './FiltersRow';
import { ChampionsSection } from './ChampionsSection';
import { SkinsSection, type LegacyFilter } from './SkinsSection';
import { ChromasSection } from './ChromasSection';
import { WardSkinsSection } from './WardSkinsSection';
import { EmotesSection } from './EmotesSection';
import { ProfileIconsSection } from './ProfileIconsSection';
import { ExportPanel } from './export/ExportPanel';
import type { LolTabId } from './LolTabId';

// Individual chromas owned, not "skins that have any chroma" — matches
// export/reportData.ts's computeCollectionCounts.
function countChromas(groups: SkinChromaGroup[] | null): number | undefined {
  return groups?.reduce((sum, g) => sum + g.chromas.length, 0);
}

export function LolWorkspace({
  summary,
  ranked,
  wallet,
  champions,
  skins,
  chromas,
  wardSkins,
  emotes,
  profileIcons,
}: {
  summary: AccountSummary;
  ranked: LolResource<RankedSummary>;
  wallet: LolResource<Wallet>;
  champions: LolResource<ChampionMasteryEntry[]>;
  skins: LolResource<OwnedSkin[]>;
  chromas: LolResource<SkinChromaGroup[]>;
  wardSkins: LolResource<OwnedWardSkin[]>;
  emotes: LolResource<OwnedEmote[]>;
  profileIcons: LolResource<OwnedProfileIcon[]>;
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
    { id: 'wardSkins', label: t('wardSkins.title'), count: wardSkins.data?.length },
    { id: 'emotes', label: t('emotes.title'), count: emotes.data?.length },
    { id: 'profileIcons', label: t('profileIcons.title'), count: profileIcons.data?.length },
    // No count: history isn't wired to real data yet, and 0 would misread
    // as "checked, found nothing" rather than "not built yet".
    { id: 'history', label: t('history.title') },
  ];

  return (
    <div className="flex min-w-0 flex-1">
      <SidebarNav items={sidebarItems} activeId={activeTab} onSelect={(id) => setActiveTab(id as LolTabId)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AccountHeader
          summary={summary}
          ranked={ranked.data}
          wallet={wallet.data}
          actions={
            ranked.data &&
            champions.data &&
            skins.data &&
            chromas.data &&
            wardSkins.data &&
            emotes.data &&
            profileIcons.data ? (
              <ExportPanel
                summary={summary}
                ranked={ranked.data}
                champions={champions.data}
                skins={skins.data}
                chromas={chromas.data}
                wardSkins={wardSkins.data}
                emotes={emotes.data}
                profileIcons={profileIcons.data}
              />
            ) : undefined
          }
        />

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

            {activeTab === 'history' && (
              <p className="text-neutral-400">{t('history.comingSoon')}</p>
            )}
          </GridDensityProvider>
        </div>
      </div>
    </div>
  );
}
