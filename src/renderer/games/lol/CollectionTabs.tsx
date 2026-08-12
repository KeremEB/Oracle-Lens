import { useState } from 'react';
import type {
  ChampionMasteryEntry,
  OwnedEmote,
  OwnedProfileIcon,
  OwnedSkin,
  OwnedWardSkin,
  SkinChromaGroup,
} from '../../../shared/types/lol';
import { t } from '../../core/i18n';
import type { LolResource } from '../../core/useLolResource';
import { Tabs } from '../../core/Tabs';
import { GridDensityProvider } from '../../core/GridDensityContext';
import { ChampionsSection } from './ChampionsSection';
import { SkinsSection } from './SkinsSection';
import { ChromasSection } from './ChromasSection';
import { WardSkinsSection } from './WardSkinsSection';
import { EmotesSection } from './EmotesSection';
import { ProfileIconsSection } from './ProfileIconsSection';

// Fetched once at the App level and shared with the export feature, so
// neither triggers a duplicate round-trip (skins/champions especially fan out
// into many CDN calls each).
export function CollectionTabs({
  champions,
  skins,
  chromas,
  wardSkins,
  emotes,
  profileIcons,
}: {
  champions: LolResource<ChampionMasteryEntry[]>;
  skins: LolResource<OwnedSkin[]>;
  chromas: LolResource<SkinChromaGroup[]>;
  wardSkins: LolResource<OwnedWardSkin[]>;
  emotes: LolResource<OwnedEmote[]>;
  profileIcons: LolResource<OwnedProfileIcon[]>;
}) {
  const [searchQuery, setSearchQuery] = useState('');

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
