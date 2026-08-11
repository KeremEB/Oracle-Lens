import { useEffect, useState } from 'react';
import type { ConnectionState } from '../shared/types/core';
import type { AccountSummary, RankedSummary } from '../shared/types/lol';
import { t } from './core/i18n';
import { AccountSummaryCard } from './games/lol/AccountSummaryCard';
import { RankedSummarySection } from './games/lol/RankedSummarySection';

export default function App() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('unavailable');
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [ranked, setRanked] = useState<RankedSummary | null>(null);
  const [rankedError, setRankedError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    window.oracleLens.lol.getConnectionStatus().then((status) => {
      if (!cancelled) setConnectionState(status.state);
    });

    const unsubscribe = window.oracleLens.lol.onConnectionStatusChange((status) => {
      setConnectionState(status.state);
      if (status.state !== 'connected') {
        setSummary(null);
        setRanked(null);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (connectionState !== 'connected') return;

    let cancelled = false;
    setSummaryError(null);

    window.oracleLens.lol
      .getAccountSummary()
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setSummaryError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      cancelled = true;
    };
  }, [connectionState]);

  useEffect(() => {
    if (connectionState !== 'connected') return;

    let cancelled = false;
    setRankedError(null);

    window.oracleLens.lol
      .getRankedSummary()
      .then((data) => {
        if (!cancelled) setRanked(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setRankedError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      cancelled = true;
    };
  }, [connectionState]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-neutral-900 text-neutral-100">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-3xl font-semibold tracking-wide">Oracle Lens</h1>

        {connectionState !== 'connected' && (
          <p className="text-neutral-400">{t('accountSummary.waiting')}</p>
        )}

        {connectionState === 'connected' && summaryError && (
          <p className="text-red-400">{summaryError}</p>
        )}

        {connectionState === 'connected' && !summaryError && !summary && (
          <p className="text-neutral-400">{t('accountSummary.loading')}</p>
        )}

        {summary && <AccountSummaryCard summary={summary} />}

        {connectionState === 'connected' && rankedError && (
          <p className="text-red-400">{rankedError}</p>
        )}

        {connectionState === 'connected' && !rankedError && !ranked && (
          <p className="text-neutral-400">{t('ranked.loading')}</p>
        )}

        {ranked && <RankedSummarySection ranked={ranked} />}
      </div>
    </div>
  );
}
