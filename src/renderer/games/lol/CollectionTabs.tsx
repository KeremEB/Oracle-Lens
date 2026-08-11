import type { ConnectionState } from '../../../shared/types/core';
import { t } from '../../core/i18n';
import { useLolResource } from '../../core/useLolResource';
import { Tabs } from '../../core/Tabs';
import { ChampionsSection } from './ChampionsSection';
import { SkinsSection } from './SkinsSection';
import { ChromasSection } from './ChromasSection';
import { WardSkinsSection } from './WardSkinsSection';
import { EmotesSection } from './EmotesSection';
import { ProfileIconsSection } from './ProfileIconsSection';

export function CollectionTabs({ connectionState }: { connectionState: ConnectionState }) {
  const champions = useLolResource(connectionState, () =>
    window.oracleLens.lol.getChampionMasteries(),
  );
  const skins = useLolResource(connectionState, () => window.oracleLens.lol.getOwnedSkins());
  const chromas = useLolResource(connectionState, () => window.oracleLens.lol.getOwnedChromas());
  const wardSkins = useLolResource(connectionState, () =>
    window.oracleLens.lol.getOwnedWardSkins(),
  );
  const emotes = useLolResource(connectionState, () => window.oracleLens.lol.getOwnedEmotes());
  const profileIcons = useLolResource(connectionState, () =>
    window.oracleLens.lol.getOwnedProfileIcons(),
  );

  return (
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
              {champions.data && <ChampionsSection champions={champions.data} />}
            </>
          ),
        },
        {
          id: 'skins',
          label: t('skins.title'),
          content: (
            <>
              {skins.error && <p className="text-red-400">{skins.error}</p>}
              {!skins.error && !skins.data && <p className="text-neutral-400">{t('skins.loading')}</p>}
              {skins.data && <SkinsSection skins={skins.data} />}
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
              {chromas.data && <ChromasSection groups={chromas.data} />}
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
              {wardSkins.data && <WardSkinsSection wards={wardSkins.data} />}
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
              {emotes.data && <EmotesSection emotes={emotes.data} />}
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
              {profileIcons.data && <ProfileIconsSection icons={profileIcons.data} />}
            </>
          ),
        },
      ]}
    />
  );
}
