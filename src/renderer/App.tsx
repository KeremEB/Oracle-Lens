import { useEffect, useState } from 'react';
import type { ConnectionState } from '../shared/types/core';
import type { AccountSummary } from '../shared/types/lol';
import { t } from './core/i18n';

export default function App() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('unavailable');
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    window.oracleLens.lol.getConnectionStatus().then((status) => {
      if (!cancelled) setConnectionState(status.state);
    });

    const unsubscribe = window.oracleLens.lol.onConnectionStatusChange((status) => {
      setConnectionState(status.state);
      if (status.state !== 'connected') {
        setSummary(null);
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
    setError(null);

    window.oracleLens.lol
      .getAccountSummary()
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      cancelled = true;
    };
  }, [connectionState]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-neutral-900 text-neutral-100">
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-wide">Oracle Lens</h1>

        {connectionState !== 'connected' && (
          <p className="text-neutral-400">{t('accountSummary.waiting')}</p>
        )}

        {connectionState === 'connected' && error && (
          <p className="text-red-400">{error}</p>
        )}

        {connectionState === 'connected' && !error && !summary && (
          <p className="text-neutral-400">{t('accountSummary.loading')}</p>
        )}

        {summary && (
          <dl className="mt-2 grid grid-cols-[auto_auto] gap-x-6 gap-y-1 text-left">
            <dt className="text-neutral-400">{t('accountSummary.summonerName')}</dt>
            <dd>{summary.summonerName}</dd>

            <dt className="text-neutral-400">{t('accountSummary.accountLevel')}</dt>
            <dd>{summary.accountLevel}</dd>

            <dt className="text-neutral-400">{t('accountSummary.region')}</dt>
            <dd>{summary.region}</dd>

            <dt className="text-neutral-400">{t('accountSummary.profileIconId')}</dt>
            <dd>{summary.profileIconId}</dd>

            <dt className="text-neutral-400">{t('accountSummary.honorLevel')}</dt>
            <dd>{summary.honorLevel}</dd>

            <dt className="text-neutral-400">{t('accountSummary.honorCheckpoint')}</dt>
            <dd>{summary.honorCheckpoint}</dd>
          </dl>
        )}
      </div>
    </div>
  );
}
