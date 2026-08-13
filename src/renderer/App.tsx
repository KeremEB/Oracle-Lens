import { useEffect, useState } from 'react';
import type { ConnectionState } from '../shared/types/core';
import { t } from './core/i18n';
import { useLolResource } from './core/useLolResource';
import { GameRail } from './core/GameRail';
import { AccountHeader } from './games/lol/AccountHeader';
import { LolWorkspace } from './games/lol/LolWorkspace';
import { ExportPanel } from './games/lol/export/ExportPanel';

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

  // Bumped by the header's manual Refresh button — every useLolResource call
  // below takes it as a dependency, so incrementing it re-runs all nine
  // fetches without needing a connectionState change.
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = (): void => setRefreshKey((key) => key + 1);

  const summary = useLolResource(
    connectionState,
    () => window.oracleLens.lol.getAccountSummary(),
    refreshKey,
  );
  const ranked = useLolResource(
    connectionState,
    () => window.oracleLens.lol.getRankedSummary(),
    refreshKey,
  );
  const wallet = useLolResource(
    connectionState,
    () => window.oracleLens.lol.getWallet(),
    refreshKey,
  );
  const champions = useLolResource(
    connectionState,
    () => window.oracleLens.lol.getChampionMasteries(),
    refreshKey,
  );
  const skins = useLolResource(
    connectionState,
    () => window.oracleLens.lol.getOwnedSkins(),
    refreshKey,
  );
  const chromas = useLolResource(
    connectionState,
    () => window.oracleLens.lol.getOwnedChromas(),
    refreshKey,
  );
  const wardSkins = useLolResource(
    connectionState,
    () => window.oracleLens.lol.getOwnedWardSkins(),
    refreshKey,
  );
  const emotes = useLolResource(
    connectionState,
    () => window.oracleLens.lol.getOwnedEmotes(),
    refreshKey,
  );
  const profileIcons = useLolResource(
    connectionState,
    () => window.oracleLens.lol.getOwnedProfileIcons(),
    refreshKey,
  );
  const loot = useLolResource(
    connectionState,
    () => window.oracleLens.lol.getPlayerLoot(),
    refreshKey,
  );

  const connected = connectionState === 'connected' && summary.data;
  const isRefreshing = [
    summary,
    ranked,
    wallet,
    champions,
    skins,
    chromas,
    wardSkins,
    emotes,
    profileIcons,
    loot,
  ].some((resource) => resource.loading);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-neutral-900 text-neutral-100">
      {/*
        Header spans the full window width, above both the game rail and the
        sidebar (not just the content column) — the rail/sidebar start below
        it, per the "account details need horizontal room" requirement.
      */}
      {connected && summary.data && (
        <AccountHeader
          summary={summary.data}
          ranked={ranked.data}
          wallet={wallet.data}
          onRefresh={refresh}
          isRefreshing={isRefreshing}
          actions={
            ranked.data &&
            champions.data &&
            skins.data &&
            chromas.data &&
            wardSkins.data &&
            emotes.data &&
            profileIcons.data ? (
              <ExportPanel
                summary={summary.data}
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
      )}

      <div className="flex min-h-0 flex-1">
        <GameRail activeGame="lol" onSelect={() => {}} />

        {connected && summary.data ? (
          <LolWorkspace
            champions={champions}
            skins={skins}
            chromas={chromas}
            wardSkins={wardSkins}
            emotes={emotes}
            profileIcons={profileIcons}
            loot={loot}
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
    </div>
  );
}
