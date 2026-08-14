import { useEffect, useRef, useState } from 'react';
import type { AccountSnapshot, AccountSnapshotMeta, ConnectionState } from '../shared/types/core';
import type { LolAccountSnapshotData } from '../shared/types/lol';
import { t } from './core/i18n';
import { useLolResource, type LolResource } from './core/useLolResource';
import { GameRail } from './core/GameRail';
import { WaitingScreen } from './core/WaitingScreen';
import { AccountHeader } from './games/lol/AccountHeader';
import { LolWorkspace } from './games/lol/LolWorkspace';

// How long the green "connected" flash holds on the waiting screen before
// the app swaps over to the LoL theme and workspace — see the
// connectionState effect below.
const CONNECT_FLASH_MS = 500;

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

  // Drives the brand-vs-LoL theme swap and the waiting screen's visibility.
  // Lags `connectionState` by CONNECT_FLASH_MS on the unavailable->connected
  // edge only, so the waiting screen gets to show its green confirmation
  // flash before the app cuts over to the LoL theme and workspace.
  const [displayConnected, setDisplayConnected] = useState(false);
  const [connectFlash, setConnectFlash] = useState(false);
  const wasConnectedRef = useRef(false);

  useEffect(() => {
    const isConnected = connectionState === 'connected';
    const wasConnected = wasConnectedRef.current;
    wasConnectedRef.current = isConnected;

    if (isConnected && !wasConnected) {
      setConnectFlash(true);
      const timer = window.setTimeout(() => {
        setConnectFlash(false);
        setDisplayConnected(true);
      }, CONNECT_FLASH_MS);
      return () => window.clearTimeout(timer);
    }

    if (!isConnected) {
      setConnectFlash(false);
      setDisplayConnected(false);
    }
  }, [connectionState]);

  // Bumped by the header's manual Refresh button (and the Ctrl+R shortcut
  // below) — every useLolResource call below takes it as a dependency, so
  // incrementing it re-runs all nine fetches without needing a
  // connectionState change.
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

  const connected = displayConnected && summary.data;
  const showWorkspace = isSnapshotMode || connected;
  // Whole-app theme, chrome included: the LoL palette only while the client
  // itself is actually connected (regardless of whether account data has
  // finished loading yet), brand chrome the rest of the time — including
  // while browsing a saved snapshot after the client has closed. Both
  // `.theme-lol` and `.theme-brand` define the same `--game-*` custom
  // properties, so every component below just consumes `var(--game-*)`
  // without needing to know which theme is actually active. Gated on
  // `displayConnected` rather than `connectionState` directly so the waiting
  // screen's green connect flash gets to play out first — see the effect above.
  const isClientConnected = displayConnected;
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

  // Ctrl+R refreshes account data instead of reloading the page. The default
  // Electron/Chromium reload accelerator is removed app-wide in main/index.ts,
  // so preventDefault here is just belt-and-suspenders.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (!event.ctrlKey || event.key.toLowerCase() !== 'r') return;
      event.preventDefault();
      if (!isRefreshing) refresh();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRefreshing]);

  return (
    <div
      className={`${isClientConnected ? 'theme-lol' : 'theme-brand'} flex h-screen w-screen flex-col overflow-hidden transition-colors duration-300`}
    >
      {/*
        Only shown while browsing a saved snapshot — offline, frozen data
        sourced entirely from disk rather than the live LCU connection (see
        `active` above). Kept as its own bar rather than folded into
        AccountHeader so it's visible no matter which tab is open.
      */}
      {isSnapshotMode && viewingSnapshot && (
        <div
          className="flex shrink-0 items-center justify-between border-b px-4 py-1.5 text-xs transition-colors duration-300"
          style={{
            borderColor: 'var(--game-accent-dark)',
            backgroundColor: 'var(--game-surface-card)',
            color: 'var(--game-accent-soft)',
          }}
        >
          <span>
            {t('history.viewingBanner')} {formatSnapshotDate(viewingSnapshot.capturedAt)}
          </span>
          <button
            type="button"
            onClick={() => setViewingSnapshot(null)}
            className="rounded px-2 py-1 font-medium hover:opacity-80"
            style={{ color: 'var(--game-accent)' }}
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
            {!isClientConnected && <WaitingScreen connected={connectFlash} />}
            {isClientConnected && summary.error && (
              <p style={{ color: 'var(--game-accent-2)' }}>{summary.error}</p>
            )}
            {isClientConnected && !summary.error && !summary.data && (
              <p style={{ color: 'var(--game-accent-muted)' }}>{t('accountSummary.loading')}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
