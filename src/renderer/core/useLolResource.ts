import { useEffect, useState } from 'react';
import type { ConnectionState } from '../../shared/types/core';

export interface LolResource<T> {
  data: T | null;
  error: string | null;
  /** True whenever a fetch is in flight — the initial load and any refresh alike. */
  loading: boolean;
}

// Shared fetch-on-connect pattern: (re)fetches whenever the connection
// becomes 'connected', clears out on any other state. `fetcher` is expected
// to be referentially stable (a bridge method reference) — it is
// intentionally excluded from the effect's dependencies.
//
// `refreshKey` is an escape hatch for the manual Refresh button: bumping it
// re-runs the fetch without a connectionState change, and — unlike the
// initial load — doesn't clear `data` first, so the UI keeps showing the
// last-known values instead of flashing back to a loading state while the
// refresh is in flight.
export function useLolResource<T>(
  connectionState: ConnectionState,
  fetcher: () => Promise<T>,
  refreshKey: number = 0,
): LolResource<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (connectionState !== 'connected') {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setError(null);
    setLoading(true);

    fetcher()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionState, refreshKey]);

  return { data, error, loading };
}
