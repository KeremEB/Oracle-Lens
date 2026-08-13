import { useEffect, useRef, useState } from 'react';
import type { AccountSnapshot, AccountSnapshotMeta, ConnectionState } from '../shared/types/core';
import type { LolAccountSnapshotData } from '../shared/types/lol';
import { t } from './core/i18n';
import { useLolResource, type LolResource } from './core/useLolResource';
import { GameRail } from './core/GameRail';
import { AccountHeader } from './games/lol/AccountHeader';
import { LolWorkspace } from './games/lol/LolWorkspace';

function asResource<T>(data: T): LolResource<T> {
  return { data, error: null, loading: false };
}

function formatSnapshotDate(epochMs: number): string {
  return new Date(epochMs).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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

  const [snapshots, setSnapshots] = useState<AccountSnapshotMeta[]>([]);
  const refreshSnapshots = (): void => {
    window.oracleLens.core
      .listSnapshots('lol')
      .then(setSnapshots)
      .catch((err: unknown) => console.warn('[history] failed to list snapshots:', err));
  };
  useEffect(() => {
    refreshSnapshots();
  }, []);

  const [viewingSnapshot, setViewingSnapshot] = useState<AccountSnapshot<LolAccountSnapshotData> | null>(
    null,
  );

  const handleViewSnapshot = (id: string): void => {
    window.oracleLens.core
      .getSnapshot(id)
      .then((snapshot) => {
        if (snapshot) setViewingSnapshot(snapshot as AccountSnapshot<LolAccountSnapshotData>);
      })
      .catch((err: unknown) => console.warn('[history] failed to load snapshot:', err));
  };

  const handleDeleteSnapshot = (id: string): void => {
    window.oracleLens.core
      .deleteSnapshot(id)
      .then(() => {
        refreshSnapshots();
        setViewingSnapshot((current) => (current?.id === id ? null : current));
      })
      .catch((err: unknown) => console.warn('[history] failed to delete snapshot:', err));
  };

  const handleClearSnapshots = (): void => {
    window.oracleLens.core
      .clearSnapshots('lol')
      .then(() => {
        refreshSnapshots();
        setViewingSnapshot(null);
      })
      .catch((err: unknown) => console.warn('[history] failed to clear snapshots:', err));
  };

  // Captures one snapshot per successful connection, once every fetch for
  // the account has landed — not on every manual Refresh click, which would
  // otherwise add a new history entry per click instead of per "viewing".
  const savedForConnectionRef = useRef(false);
  useEffect(() => {
    if (connectionState !== 'connected') {
      savedForConnectionRef.current = false;
      return;
    }
    if (savedForConnectionRef.current) return;
    if (
      !summary.data ||
      !ranked.data ||
      !wallet.data ||
      !champions.data ||
      !skins.data ||
      !chromas.data ||
      !wardSkins.data ||
      !emotes.data ||
      !profileIcons.data ||
      !loot.data
    ) {
      return;
    }

    savedForConnectionRef.current = true;

    const data: LolAccountSnapshotData = {
      summary: summary.data,
      ranked: ranked.data,
      wallet: wallet.data,
      champions: champions.data,
      skins: skins.data,
      chromas: chromas.data,
      wardSkins: wardSkins.data,
      emotes: emotes.data,
      profileIcons: profileIcons.data,
      loot: loot.data,
    };

    window.oracleLens.core
      .saveSnapshot({
        gameId: 'lol',
        accountKey: `${summary.data.region}:${summary.data.accountId}`,
        label: summary.data.summonerName,
        subtitle: summary.data.region,
        data,
      })
      .then(refreshSnapshots)
      .catch((err: unknown) => console.warn('[history] failed to save snapshot:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    connectionState,
    summary.data,
    ranked.data,
    wallet.data,
    champions.data,
    skins.data,
    chromas.data,
    wardSkins.data,
    emotes.data,
    profileIcons.data,
    loot.data,
  ]);

  const isSnapshotMode = viewingSnapshot !== null;

  const liveResources = { summary, ranked, wallet, champions, skins, chromas, wardSkins, emotes, profileIcons, loot };
  const snapshotResources = viewingSnapshot && {
    summary: asResource(viewingSnapshot.data.summary),
    ranked: asResource(viewingSnapshot.data.ranked),
    wallet: asResource(viewingSnapshot.data.wallet),
    champions: asResource(viewingSnapshot.data.champions),
    skins: asResource(viewingSnapshot.data.skins),
    chromas: asResource(viewingSnapshot.data.chromas),
    wardSkins: asResource(viewingSnapshot.data.wardSkins),
    emotes: asResource(viewingSnapshot.data.emotes),
    profileIcons: asResource(viewingSnapshot.data.profileIcons),
    loot: asResource(viewingSnapshot.data.loot),
  };
  const active = snapshotResources ?? liveResources;

  const connected = connectionState === 'connected' && summary.data;
  const showWorkspace = isSnapshotMode || connected;
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
        Only shown while browsing a saved snapshot — offline, frozen data
        sourced entirely from disk rather than the live LCU connection (see
        `active` above). Kept as its own bar rather than folded into
        AccountHeader so it's visible no matter which tab is open.
      */}
      {isSnapshotMode && viewingSnapshot && (
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-800 bg-neutral-800/60 px-4 py-1.5 text-xs">
          <span className="text-neutral-300">
            {t('history.viewingBanner')} {formatSnapshotDate(viewingSnapshot.capturedAt)}
          </span>
          <button
            type="button"
            onClick={() => setViewingSnapshot(null)}
            className="rounded px-2 py-1 font-medium text-neutral-200 hover:bg-neutral-700"
          >
            {t('history.backToLive')}
          </button>
        </div>
      )}

      {/*
        Header spans the full window width, above both the game rail and the
        sidebar (not just the content column) — the rail/sidebar start below
        it, per the "account details need horizontal room" requirement.
      */}
      {showWorkspace && active.summary.data && (
        <AccountHeader
          summary={active.summary.data}
          ranked={active.ranked.data}
          wallet={active.wallet.data}
          onRefresh={refresh}
          isRefreshing={!isSnapshotMode && isRefreshing}
        />
      )}

      <div className="flex min-h-0 flex-1">
        <GameRail activeGame="lol" onSelect={() => {}} />

        {showWorkspace && active.summary.data ? (
          <LolWorkspace
            key={isSnapshotMode ? `snapshot-${viewingSnapshot?.id}` : 'live'}
            summary={active.summary.data}
            ranked={active.ranked.data}
            champions={active.champions}
            skins={active.skins}
            chromas={active.chromas}
            wardSkins={active.wardSkins}
            emotes={active.emotes}
            profileIcons={active.profileIcons}
            loot={active.loot}
            snapshots={snapshots}
            activeSnapshotId={viewingSnapshot?.id ?? null}
            onViewSnapshot={handleViewSnapshot}
            onDeleteSnapshot={handleDeleteSnapshot}
            onClearSnapshots={handleClearSnapshots}
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
