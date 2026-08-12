import { useEffect, useState } from 'react';
import type { ConnectionState } from '../shared/types/core';
import { t } from './core/i18n';
import { useLolResource } from './core/useLolResource';
import { GameRail } from './core/GameRail';
import { LolWorkspace } from './games/lol/LolWorkspace';

export default function App() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('unavailable');

  useEffect(() => {
    let cancelled = false;

    window.oracleLens.lol.getConnectionStatus().then((status) => {
      if (!cancelled) setConnectionState(status.state);
    });

    const unsubscribe = window.oracleLens.lol.onConnectionStatusChange((status) => {
      setConnectionState(status.state);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const summary = useLolResource(connectionState, () => window.oracleLens.lol.getAccountSummary());
  const ranked = useLolResource(connectionState, () => window.oracleLens.lol.getRankedSummary());
  const wallet = useLolResource(connectionState, () => window.oracleLens.lol.getWallet());
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
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-900 text-neutral-100">
      <GameRail activeGame="lol" onSelect={() => {}} />

      {connectionState === 'connected' && summary.data ? (
        <LolWorkspace
          summary={summary.data}
          ranked={ranked}
          wallet={wallet}
          champions={champions}
          skins={skins}
          chromas={chromas}
          wardSkins={wardSkins}
          emotes={emotes}
          profileIcons={profileIcons}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          {connectionState !== 'connected' && (
            <p className="text-neutral-400">{t('accountSummary.waiting')}</p>
          )}
          {connectionState === 'connected' && summary.error && (
            <p className="text-red-400">{summary.error}</p>
          )}
          {connectionState === 'connected' && !summary.error && !summary.data && (
            <p className="text-neutral-400">{t('accountSummary.loading')}</p>
          )}
        </div>
      )}
    </div>
  );
}
