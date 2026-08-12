import { useEffect, useState } from 'react';
import type { ConnectionState } from '../shared/types/core';
import { t } from './core/i18n';
import { useLolResource } from './core/useLolResource';
import { AccountSummaryCard } from './games/lol/AccountSummaryCard';
import { RankedSummarySection } from './games/lol/RankedSummarySection';
import { ValueScoreCard } from './games/lol/ValueScoreCard';
import { CollectionTabs } from './games/lol/CollectionTabs';

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
  // Fetched here (not inside CollectionTabs) so both the Skins tab and the
  // value score card share one fetch instead of downloading the whole skin
  // collection (tile images included) twice.
  const skins = useLolResource(connectionState, () => window.oracleLens.lol.getOwnedSkins());

  return (
    <div className="h-screen w-screen overflow-y-auto bg-neutral-900 text-neutral-100">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 p-8">
        <h1 className="text-3xl font-semibold tracking-wide">Oracle Lens</h1>

        {connectionState !== 'connected' && (
          <p className="text-neutral-400">{t('accountSummary.waiting')}</p>
        )}

        {connectionState === 'connected' && summary.error && (
          <p className="text-red-400">{summary.error}</p>
        )}
        {connectionState === 'connected' && !summary.error && !summary.data && (
          <p className="text-neutral-400">{t('accountSummary.loading')}</p>
        )}
        {summary.data && <AccountSummaryCard summary={summary.data} />}

        {connectionState === 'connected' && ranked.error && (
          <p className="text-red-400">{ranked.error}</p>
        )}
        {connectionState === 'connected' && !ranked.error && !ranked.data && (
          <p className="text-neutral-400">{t('ranked.loading')}</p>
        )}
        {ranked.data && <RankedSummarySection ranked={ranked.data} />}

        {skins.data && <ValueScoreCard skins={skins.data} />}

        {connectionState === 'connected' && (
          <CollectionTabs connectionState={connectionState} skins={skins} />
        )}
      </div>
    </div>
  );
}
