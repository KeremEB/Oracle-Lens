import { useState } from 'react';
import type { ConnectionState } from '../../../shared/types/core';
import type { OwnedSkin } from '../../../shared/types/lol';
import { t } from '../../core/i18n';
import { useLolResource, type LolResource } from '../../core/useLolResource';
import { Tabs } from '../../core/Tabs';
import { GridDensityProvider } from '../../core/GridDensityContext';
import { ChampionsSection } from './ChampionsSection';
import { SkinsSection } from './SkinsSection';
import { ChromasSection } from './ChromasSection';
import { WardSkinsSection } from './WardSkinsSection';
import { EmotesSection } from './EmotesSection';
import { ProfileIconsSection } from './ProfileIconsSection';

export function CollectionTabs({
  connectionState,
  skins,
}: {
  connectionState: ConnectionState;
  /** Fetched once at the App level and shared with the value score card. */
  skins: LolResource<OwnedSkin[]>;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const champions = useLolResource(connectionState, () =>
    window.oracleLens.lol.getChampionMasteries(),
  );
  const chromas = useLolResource(connectionState, () => window.oracleLens.lol.getOwnedChromas());
  const wardSkins = useLolResource(connectionState, () =>
    window.oracleLens.lol.getOwnedWardSkins(),
  );
  const emotes = useLolResource(connectionState, () => window.oracleLens.lol.getOwnedEmotes());
  const profileIcons = useLolResource(connectionState, () =>
    window.oracleLens.lol.getOwnedProfileIcons(),
  );

  return (
    <GridDensityProvider>
      <div className="w-full">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('search.placeholder')}
          className="mb-4 w-full max-w-sm rounded border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-100 placeholder:text-neutral-500"
        />

        <Tabs
          tabs={[
            {
              id: 'champions',
              label: t('champions.title'),
              content: (
                <>
                  {champions.error && <p className="text-red-400">{champions.error}</p>}
                  {!champions.error && !champions.data && (
                    <p className="text-neutral-400">{t('champions.loading')}</p>
                  )}
                  {champions.data && (
                    <ChampionsSection champions={champions.data} searchQuery={searchQuery} />
                  )}
                </>
              ),
            },
            {
              id: 'skins',
              label: t('skins.title'),
              content: (
                <>
                  {skins.error && <p className="text-red-400">{skins.error}</p>}
                  {!skins.error && !skins.data && (
                    <p className="text-neutral-400">{t('skins.loading')}</p>
                  )}
                  {skins.data && <SkinsSection skins={skins.data} searchQuery={searchQuery} />}
                </>
              ),
            },
            {
              id: 'chromas',
              label: t('chromas.title'),
              content: (
                <>
                  {chromas.error && <p className="text-red-400">{chromas.error}</p>}
                  {!chromas.error && !chromas.data && (
                    <p className="text-neutral-400">{t('chromas.loading')}</p>
                  )}
                  {chromas.data && (
                    <ChromasSection groups={chromas.data} searchQuery={searchQuery} />
                  )}
                </>
              ),
            },
            {
              id: 'wardSkins',
              label: t('wardSkins.title'),
              content: (
                <>
                  {wardSkins.error && <p className="text-red-400">{wardSkins.error}</p>}
                  {!wardSkins.error && !wardSkins.data && (
                    <p className="text-neutral-400">{t('wardSkins.loading')}</p>
                  )}
                  {wardSkins.data && (
                    <WardSkinsSection wards={wardSkins.data} searchQuery={searchQuery} />
                  )}
                </>
              ),
            },
            {
              id: 'emotes',
              label: t('emotes.title'),
              content: (
                <>
                  {emotes.error && <p className="text-red-400">{emotes.error}</p>}
                  {!emotes.error && !emotes.data && (
                    <p className="text-neutral-400">{t('emotes.loading')}</p>
                  )}
                  {emotes.data && (
                    <EmotesSection emotes={emotes.data} searchQuery={searchQuery} />
                  )}
                </>
              ),
            },
            {
              id: 'profileIcons',
              label: t('profileIcons.title'),
              content: (
                <>
                  {profileIcons.error && <p className="text-red-400">{profileIcons.error}</p>}
                  {!profileIcons.error && !profileIcons.data && (
                    <p className="text-neutral-400">{t('profileIcons.loading')}</p>
                  )}
                  {profileIcons.data && (
                    <ProfileIconsSection icons={profileIcons.data} searchQuery={searchQuery} />
                  )}
                </>
              ),
            },
          ]}
        />
      </div>
    </GridDensityProvider>
  );
}
